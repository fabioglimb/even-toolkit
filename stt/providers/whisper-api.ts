import type {
  STTProvider,
  STTProviderConfig,
  STTMode,
  STTState,
  STTTranscript,
  STTError,
} from '../types';
import { float32ToWav } from '../audio/pcm-utils';
import { sttLog } from '../debug';

// Use proxy path to avoid WebView fetch restrictions (CORS/upload limits)
// The proxy is configured in vite.config.ts: /__whisper → api.openai.com
const WHISPER_API_URL = '/__whisper/v1/audio/transcriptions';

// Whisper hallucinates these on silence/low audio — filter them out
const HALLUCINATION_PATTERNS = [
  /sottotitoli/i,
  /amara\.org/i,
  /qtss/i,
  /continua\./i,
  /al prossimo episodio/i,
  /prossimo episodio/i,
  /alla prossima/i,
  /a presto/i,
  /thank you for watching/i,
  /thanks for watching/i,
  /please subscribe/i,
  /see you next time/i,
  /see you in the next/i,
  /next episode/i,
  /sous-titres/i,
  /untertitel/i,
  /subtítulos/i,
  /bis zum nächsten/i,
  /字幕/,
  /you$/i,
  /^\s*$/,
];

/** Common phrases Whisper appends at the end of audio — strip them */
const TRAILING_HALLUCINATIONS = [
  /\s*al prossimo episodio\.?\s*$/i,
  /\s*alla prossima\.?\s*$/i,
  /\s*a presto\.?\s*$/i,
  /\s*grazie per la visione\.?\s*$/i,
  /\s*thank you for watching\.?\s*$/i,
  /\s*thanks for watching\.?\s*$/i,
  /\s*see you next time\.?\s*$/i,
  /\s*see you in the next episode\.?\s*$/i,
  /\s*please subscribe\.?\s*$/i,
  /\s*bis zum nächsten mal\.?\s*$/i,
];

/** Check if text is just dots, punctuation, or too short to be real speech */
function isJunkTranscription(text: string): boolean {
  const cleaned = text.replace(/[\s.,!?;:…\-–—]+/g, '');
  if (cleaned.length === 0) return true;
  if (cleaned.length < 2) return true;
  return HALLUCINATION_PATTERNS.some(p => p.test(text));
}

/** Strip trailing hallucination phrases from otherwise valid text */
function cleanTranscription(text: string): string {
  let result = text;
  for (const pattern of TRAILING_HALLUCINATIONS) {
    result = result.replace(pattern, '');
  }
  return result.trim();
}

export class WhisperApiProvider implements STTProvider {
  readonly type = 'whisper-api' as const;
  readonly supportedModes: STTMode[] = ['batch'];

  private _state: STTState = 'idle';
  private apiKey = '';
  private language = 'en';
  private modelId = 'whisper-1';

  private transcriptCbs: Array<(t: STTTranscript) => void> = [];
  private stateCbs: Array<(s: STTState) => void> = [];
  private errorCbs: Array<(e: STTError) => void> = [];

  get state(): STTState {
    return this._state;
  }

  async init(config: STTProviderConfig): Promise<void> {
    this.apiKey = config.apiKey ?? '';
    this.language = (config.language ?? 'en').split('-')[0];
    this.modelId = config.modelId ?? 'whisper-1';

    if (!this.apiKey) {
      const err: STTError = { code: 'not-allowed', message: 'OpenAI API key required — set it in Settings', provider: this.type };
      this.emitError(err);
      throw new Error(err.message);
    }
  }

  start(): void {
    // Batch mode — no-op; audio is fed via transcribe()
  }

  stop(): void {
    this.setState('idle');
  }

  abort(): void {
    this.setState('idle');
  }

  dispose(): void {
    this.transcriptCbs = [];
    this.stateCbs = [];
    this.errorCbs = [];
    this.setState('idle');
  }

  async transcribe(audio: Float32Array, sampleRate: number): Promise<STTTranscript> {
    this.setState('processing');

    try {
      const wavBlob = float32ToWav(audio, sampleRate);
      sttLog('whisper-api: sending', (audio.length / sampleRate).toFixed(1), 's audio,', (wavBlob.size / 1024).toFixed(0), 'KB WAV');

      const formData = new FormData();
      formData.append('file', wavBlob, 'audio.wav');
      formData.append('model', this.modelId);
      formData.append('language', this.language);

      const response = await fetch(WHISPER_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const code: STTError['code'] = response.status === 401 ? 'not-allowed' : 'network';
        const message = `Whisper API error: ${response.status} ${response.statusText}`;
        const err: STTError = { code, message, provider: this.type };
        this.emitError(err);
        this.setState('error');
        throw new Error(message);
      }

      const json = (await response.json()) as { text: string };

      // Filter and clean Whisper hallucinations
      const rawText = json.text?.trim() ?? '';
      const text = cleanTranscription(rawText);
      if (isJunkTranscription(text)) {
        const transcript: STTTranscript = {
          text: '',
          isFinal: true,
          confidence: 0,
          timestamp: Date.now(),
        };
        this.setState('idle');
        return transcript;
      }

      const transcript: STTTranscript = {
        text,
        isFinal: true,
        confidence: 1,
        timestamp: Date.now(),
      };

      this.emitTranscript(transcript);
      this.setState('idle');
      return transcript;
    } catch (err: any) {
      // If already handled (HTTP error), just rethrow
      if (this._state === 'error') throw err;

      const sttError: STTError = {
        code: 'network',
        message: err?.message ?? 'Network error',
        provider: this.type,
      };
      this.emitError(sttError);
      this.setState('error');
      throw err;
    }
  }

  onTranscript(cb: (t: STTTranscript) => void): () => void {
    this.transcriptCbs.push(cb);
    return () => { this.transcriptCbs = this.transcriptCbs.filter((c) => c !== cb); };
  }

  onStateChange(cb: (s: STTState) => void): () => void {
    this.stateCbs.push(cb);
    return () => { this.stateCbs = this.stateCbs.filter((c) => c !== cb); };
  }

  onError(cb: (e: STTError) => void): () => void {
    this.errorCbs.push(cb);
    return () => { this.errorCbs = this.errorCbs.filter((c) => c !== cb); };
  }

  // ── Private ──

  private setState(s: STTState): void {
    if (this._state === s) return;
    this._state = s;
    for (const cb of this.stateCbs) cb(s);
  }

  private emitTranscript(t: STTTranscript): void {
    for (const cb of this.transcriptCbs) cb(t);
  }

  private emitError(e: STTError): void {
    for (const cb of this.errorCbs) cb(e);
  }
}
