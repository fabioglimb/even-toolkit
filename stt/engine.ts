import type {
  STTEngineConfig,
  STTProvider,
  STTState,
  STTTranscript,
  STTError,
  AudioSource,
} from './types';
import { createProvider } from './registry';
import { MicrophoneSource } from './sources/microphone';
import { GlassBridgeSource } from './sources/glass-bridge';
import { resample } from './audio/resample';
import { createVAD } from './audio/vad';
import { createAudioBuffer } from './audio/buffer';
import { sttLog } from './debug';

/**
 * STTEngine — orchestrates audio source -> processing -> provider.
 *
 * Batch providers (whisper-api): record audio, then transcribe on stop.
 * Streaming providers (deepgram): pipe audio in real-time via sendAudio.
 */

export class STTEngine {
  private config: STTEngineConfig;
  private provider: STTProvider | null = null;
  private source: AudioSource | null = null;
  private sourceUnsub: (() => void) | null = null;

  private transcriptListeners: Array<(t: STTTranscript) => void> = [];
  private stateListeners: Array<(s: STTState) => void> = [];
  private errorListeners: Array<(e: STTError) => void> = [];

  private providerUnsubs: Array<() => void> = [];

  private vad: ReturnType<typeof createVAD> | null = null;
  private chunkBuffer: ReturnType<typeof createAudioBuffer> | null = null;
  private targetSampleRate: number;
  private stopped = false;

  constructor(config: STTEngineConfig) {
    this.config = config;
    this.targetSampleRate = config.sampleRate ?? 16000;
  }

  // -- Event subscriptions --

  onTranscript(cb: (t: STTTranscript) => void): () => void {
    this.transcriptListeners.push(cb);
    return () => {
      const idx = this.transcriptListeners.indexOf(cb);
      if (idx >= 0) this.transcriptListeners.splice(idx, 1);
    };
  }

  onStateChange(cb: (s: STTState) => void): () => void {
    this.stateListeners.push(cb);
    return () => {
      const idx = this.stateListeners.indexOf(cb);
      if (idx >= 0) this.stateListeners.splice(idx, 1);
    };
  }

  onError(cb: (e: STTError) => void): () => void {
    this.errorListeners.push(cb);
    return () => {
      const idx = this.errorListeners.indexOf(cb);
      if (idx >= 0) this.errorListeners.splice(idx, 1);
    };
  }

  private emitTranscript(t: STTTranscript): void {
    sttLog('transcript:', t.isFinal ? 'FINAL' : 'interim', `"${t.text}"`);
    for (const cb of this.transcriptListeners) cb(t);
  }

  private emitState(s: STTState): void {
    sttLog('state ->', s);
    for (const cb of this.stateListeners) cb(s);
  }

  private emitError(e: STTError): void {
    sttLog('ERROR:', e.code, e.message);
    for (const cb of this.errorListeners) cb(e);
  }

  // -- Lifecycle --

  async start(): Promise<void> {
    sttLog('engine.start()', 'provider:', this.config.provider, 'source:', this.config.source ?? 'auto');
    this.stopped = false;

    // Reuse existing provider if already initialized
    if (this.provider) {
      sttLog('engine: reusing provider');
      return this.startAudioPipeline();
    }

    this.emitState('loading');

    try {
      this.provider = await createProvider(this.config.provider);
      sttLog('provider created:', this.provider.type, 'modes:', this.provider.supportedModes);
      this.subscribeProvider(this.provider);

      await this.provider.init({
        language: this.config.language,
        mode: this.config.mode,
        apiKey: this.config.apiKey,
        modelId: this.config.modelId,
        continuous: this.config.continuous,
        vadEnabled: typeof this.config.vad === 'boolean' ? this.config.vad : !!this.config.vad,
        vadSilenceMs: typeof this.config.vad === 'object' ? this.config.vad.silenceMs : undefined,
        sampleRate: this.targetSampleRate,
      });
      sttLog('provider.init() done');
      await this.startAudioPipeline();
    } catch (err) {
      sttLog('engine.start() FAILED:', err);
      const error: STTError = {
        code: 'unknown',
        message: err instanceof Error ? err.message : String(err),
        provider: this.config.provider,
      };
      this.emitError(error);
      this.emitState('error');

      if (this.config.fallback) {
        await this.switchToFallback();
      }
    }
  }

  /** Set up audio source + wire to provider. Reusable for restart. */
  private async startAudioPipeline(): Promise<void> {
    if (!this.provider) throw new Error('No provider');

    // Streaming providers -- pipe audio via sendAudio
    if ('sendAudio' in this.provider) {
      this.source = this.resolveSource();
      sttLog('streaming + sendAudio: source =', this.source.constructor.name);
      await this.source.start();
      const provider = this.provider;
      this.sourceUnsub = this.source.onAudioData((pcm, sampleRate) => {
        const samples = sampleRate !== this.targetSampleRate
          ? resample(pcm, sampleRate, this.targetSampleRate)
          : pcm;
        (provider as any).sendAudio(samples);
      });
      this.emitState('listening');
      this.provider.start();
      sttLog('streaming provider started');
      return;
    }

    // Batch providers: set up audio pipeline
    this.source = this.resolveSource();
    sttLog('audio source resolved:', this.source.constructor.name);
    await this.source.start();

    const vadConfig = typeof this.config.vad === 'object' ? {
      silenceThresholdMs: this.config.vad.silenceMs ?? 2500,
      speechThresholdDb: this.config.vad.thresholdDb,
    } : { silenceThresholdMs: 2500 };
    this.vad = createVAD(vadConfig);
    this.chunkBuffer = createAudioBuffer({ sampleRate: this.targetSampleRate, maxSeconds: 120 });

    this.sourceUnsub = this.source.onAudioData((pcm, sampleRate) => {
      this.processAudio(pcm, sampleRate);
    });

    this.emitState('listening');
    this.provider.start();
    sttLog('engine listening');
  }

  stop(): void {
    if (this.stopped) return;
    this.stopped = true;
    sttLog('engine.stop()');

    this.sourceUnsub?.();
    this.sourceUnsub = null;
    this.source?.stop();
    this.provider?.stop();
    this.vad?.reset();

    this.transcribeFullBuffer();
  }

  abort(): void {
    this.stopped = true;
    sttLog('engine.abort()');
    this.provider?.abort();
    this.sourceUnsub?.();
    this.sourceUnsub = null;
    this.source?.stop();
    this.vad?.reset();
    this.chunkBuffer?.clear();
  }

  dispose(): void {
    this.abort();
    for (const unsub of this.providerUnsubs) unsub();
    this.providerUnsubs.length = 0;
    this.provider?.dispose();
    this.provider = null;
    this.source?.dispose();
    this.source = null;
    this.transcriptListeners.length = 0;
    this.stateListeners.length = 0;
    this.errorListeners.length = 0;
  }

  // -- Internal --

  private resolveSource(): AudioSource {
    const src = this.config.source;

    // Explicit AudioSource object passed
    if (src && typeof src === 'object') {
      sttLog('resolveSource: using custom AudioSource object');
      return src;
    }

    // Explicit glass-bridge
    if (src === 'glass-bridge') {
      sttLog('resolveSource: explicit glass-bridge');
      return new GlassBridgeSource();
    }

    // Auto-detect: if glasses bridge is available, prefer it
    if ((window as any).__evenBridge) {
      sttLog('resolveSource: auto-detected __evenBridge -> using GlassBridgeSource');
      return new GlassBridgeSource();
    }

    // Explicit microphone or fallback
    if (!src || src === 'microphone') {
      sttLog('resolveSource: using MicrophoneSource (browser mic)');
      return new MicrophoneSource();
    }

    return src;
  }

  private processAudio(pcm: Float32Array, sampleRate: number): void {
    if (this.stopped) return;

    const samples = sampleRate !== this.targetSampleRate
      ? resample(pcm, sampleRate, this.targetSampleRate)
      : pcm;

    this.chunkBuffer?.append(samples);

    // VAD: detect speech end for auto-stop
    if (this.vad) {
      const result = this.vad.process(samples);
      if (result.speechEnded && !this.config.continuous) {
        sttLog('VAD: speech ended -> auto-stop');
        this.stop();
      }
    }
  }

  /** On stop: transcribe the full recording buffer */
  private async transcribeFullBuffer(): Promise<void> {
    if (!this.provider?.transcribe || !this.chunkBuffer) {
      this.emitState('idle');
      return;
    }

    const audio = this.chunkBuffer.getAll();
    this.chunkBuffer.clear();
    this.chunkBuffer = null;

    if (audio.length < this.targetSampleRate * 0.3) {
      sttLog('audio too short, skipping');
      this.emitState('idle');
      return;
    }

    this.emitState('processing');
    sttLog('transcribing full buffer:', (audio.length / this.targetSampleRate).toFixed(1), 's,', (audio.byteLength / 1024).toFixed(0), 'KB');

    try {
      const result = await this.provider.transcribe(audio, this.targetSampleRate);
      const text = result.text.trim();
      sttLog('final result:', `"${text}"`);

      if (text) {
        this.emitTranscript({
          text,
          isFinal: true,
          confidence: result.confidence,
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      this.emitError({
        code: 'unknown',
        message: err instanceof Error ? err.message : String(err),
        provider: this.config.provider,
      });
    }

    this.emitState('idle');
  }

  private subscribeProvider(provider: STTProvider): void {
    const isStreaming = provider.supportedModes.includes('streaming');

    this.providerUnsubs.push(
      // Forward transcripts from streaming providers (deepgram emits them directly)
      // Batch providers (whisper-api) are handled by transcribeFullBuffer — don't double-emit
      provider.onTranscript((t) => {
        if (isStreaming) this.emitTranscript(t);
      }),
      provider.onStateChange((s) => {
        if (isStreaming) this.emitState(s);
      }),
      provider.onError((e) => {
        this.emitError(e);
        if (this.config.fallback) {
          this.switchToFallback();
        }
      }),
    );
  }

  private async switchToFallback(): Promise<void> {
    if (!this.config.fallback) return;
    sttLog('switching to fallback provider:', this.config.fallback);

    for (const unsub of this.providerUnsubs) unsub();
    this.providerUnsubs.length = 0;
    this.provider?.dispose();
    this.provider = null;

    const fallbackType = this.config.fallback;
    this.config = { ...this.config, provider: fallbackType, fallback: undefined };

    try {
      await this.start();
    } catch {
      // Fallback also failed
    }
  }
}
