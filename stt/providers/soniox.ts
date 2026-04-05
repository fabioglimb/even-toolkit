import type {
  STTProvider,
  STTProviderConfig,
  STTMode,
  STTState,
  STTTranscript,
  STTError,
} from '../types';
import { float32ToPcm16 } from '../audio/pcm-utils';
import { sttLog } from '../debug';

interface SonioxToken {
  text: string;
  is_final: boolean;
  confidence?: number;
}

interface SonioxMessage {
  tokens?: SonioxToken[];
  finished?: boolean;
  error_code?: number;
  error_message?: string;
}

export class SonioxProvider implements STTProvider {
  readonly type = 'soniox' as const;
  readonly supportedModes: STTMode[] = ['streaming'];

  private _state: STTState = 'idle';
  private apiKey = '';
  private modelId = 'stt-rt-v4';
  private sampleRate = 16000;
  private language = '';
  private ws: WebSocket | null = null;
  private suppressSocketEvents = false;

  private transcriptCbs: Array<(t: STTTranscript) => void> = [];
  private stateCbs: Array<(s: STTState) => void> = [];
  private errorCbs: Array<(e: STTError) => void> = [];

  get state(): STTState {
    return this._state;
  }

  async init(config: STTProviderConfig): Promise<void> {
    this.apiKey = config.apiKey ?? '';
    this.modelId = config.modelId ?? 'stt-rt-v4';
    this.sampleRate = config.sampleRate ?? 16000;
    this.language = config.language ?? '';

    if (!this.apiKey) {
      const err: STTError = { code: 'not-allowed', message: 'Soniox API key is required', provider: this.type };
      this.emitError(err);
      throw new Error(err.message);
    }
  }

  start(): void {
    if (this.ws) {
      this.closeSocket(true);
    }
    this.suppressSocketEvents = false;

    const url = 'wss://stt-rt.soniox.com/transcribe-websocket';

    this.ws = new WebSocket(url);
    this.ws.binaryType = 'arraybuffer';

    sttLog('soniox: connecting to', url);

    this.ws.onopen = () => {
      sttLog('soniox: connected, sending config');
      const lang = this.language;
      const configMsg = JSON.stringify({
        api_key: this.apiKey,
        model: this.modelId,
        audio_format: 'pcm_s16le',
        sample_rate: this.sampleRate,
        num_channels: 1,
        enable_endpoint_detection: true,
        ...(lang ? { language_hints: [lang.split('-')[0]] } : {}),
      });
      this.ws?.send(configMsg);
      this.setState('listening');
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string) as SonioxMessage;

        if (data.error_code || data.error_message) {
          sttLog('soniox: server error', data.error_code, data.error_message);
          const err: STTError = {
            code: data.error_code === 401 ? 'not-allowed' : 'network',
            message: data.error_message ?? `Soniox error ${data.error_code}`,
            provider: this.type,
          };
          this.emitError(err);
          this.setState('error');
          this.closeSocket(true);
          return;
        }

        if (data.finished) {
          sttLog('soniox: received finished signal');
          this.setState('idle');
          this.closeSocket(true);
          return;
        }

        const tokens = data.tokens;
        if (!tokens || tokens.length === 0) return;

        // Filter out Soniox control tags (<end>, <fin>, etc.)
        const filtered = tokens.filter((t) => !/<[^>]+>/.test(t.text.trim()));
        if (filtered.length === 0) return;

        // Build text from THIS message's tokens only
        // The useSTT hook handles accumulation across messages
        let finalText = '';
        let interimText = '';
        let confidenceSum = 0;
        let confidenceCount = 0;

        for (const token of filtered) {
          if (token.is_final) {
            finalText += token.text;
          } else {
            interimText += token.text;
          }
          if (token.confidence != null) {
            confidenceSum += token.confidence;
            confidenceCount++;
          }
        }

        const text = finalText || interimText;
        if (!text.trim()) return;

        const hasFinal = finalText.length > 0;
        const avgConfidence = confidenceCount > 0 ? confidenceSum / confidenceCount : 0;

        sttLog('soniox: got', hasFinal ? 'FINAL' : 'interim', `"${text}"`);

        const transcript: STTTranscript = {
          text: text.trim(),
          isFinal: hasFinal && interimText.length === 0,
          confidence: avgConfidence,
          timestamp: Date.now(),
        };
        this.emitTranscript(transcript);
      } catch {
        // Non-JSON message, ignore
      }
    };

    this.ws.onerror = (event) => {
      if (this.suppressSocketEvents) return;
      sttLog('soniox: WebSocket error', event);
      const err: STTError = {
        code: 'network',
        message: 'Soniox WebSocket error',
        provider: this.type,
      };
      this.emitError(err);
      this.setState('error');
    };

    this.ws.onclose = () => {
      this.ws = null;
      if (this.suppressSocketEvents) {
        this.suppressSocketEvents = false;
        this.setState('idle');
        return;
      }
      if (this._state === 'listening') {
        this.setState('idle');
      }
    };
  }

  /** Send audio data to the Soniox stream. Converts Float32 to Int16 PCM. */
  sendAudio(data: ArrayBuffer | Int16Array | Float32Array): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    if (data instanceof Float32Array) {
      const int16 = float32ToPcm16(data);
      this.ws.send(int16.buffer);
    } else if (data instanceof Int16Array) {
      this.ws.send(data.buffer);
    } else {
      this.ws.send(data);
    }
  }

  stop(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Send finalize message per Soniox protocol
      this.ws.send(JSON.stringify({ type: 'finalize' }));
      // Send empty binary frame to signal end of audio
      this.ws.send(new ArrayBuffer(0));
      sttLog('soniox: sent finalize + empty frame');
      // The WebSocket will close after receiving { finished: true }
    } else {
      this.closeSocket(true);
    }
  }

  abort(): void {
    this.closeSocket(true);
  }

  dispose(): void {
    this.closeSocket(true);
    this.transcriptCbs = [];
    this.stateCbs = [];
    this.errorCbs = [];
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

  private closeSocket(silent = false): void {
    const socket = this.ws;
    if (socket) {
      this.ws = null;
      if (silent) {
        this.suppressSocketEvents = true;
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
      }
      try { socket.close(); } catch { /* ignore */ }
    }
    this.setState('idle');
  }

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
