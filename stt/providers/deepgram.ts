import type {
  STTProvider,
  STTProviderConfig,
  STTMode,
  STTState,
  STTTranscript,
  STTError,
} from '../types';
import { sttLog } from '../debug';

interface DeepgramResult {
  channel?: {
    alternatives?: Array<{
      transcript?: string;
      confidence?: number;
    }>;
  };
  is_final?: boolean;
  speech_final?: boolean;
}

export class DeepgramProvider implements STTProvider {
  readonly type = 'deepgram' as const;
  readonly supportedModes: STTMode[] = ['streaming'];

  private _state: STTState = 'idle';
  private apiKey = '';
  private language = 'en';
  private modelId = 'nova-2';
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
    this.language = (config.language ?? 'en').split('-')[0]; // Deepgram wants 'en' not 'en-US'
    this.modelId = config.modelId ?? 'nova-2';

    if (!this.apiKey) {
      const err: STTError = { code: 'not-allowed', message: 'Deepgram API key is required', provider: this.type };
      this.emitError(err);
      throw new Error(err.message);
    }
  }

  start(): void {
    if (this.ws) {
      this.closeSocket(true);
    }
    this.suppressSocketEvents = false;

    const params = new URLSearchParams({
      model: this.modelId,
      language: this.language,
      interim_results: 'true',
      punctuate: 'true',
      encoding: 'linear16',
      sample_rate: '16000',
    });

    const url = `wss://api.deepgram.com/v1/listen?${params.toString()}`;

    this.ws = new WebSocket(url, ['token', this.apiKey]);
    this.ws.binaryType = 'arraybuffer';

    sttLog('deepgram: connecting to', url.substring(0, 60) + '...');

    this.ws.onopen = () => {
      sttLog('deepgram: connected');
      this.setState('listening');
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string) as DeepgramResult;
        const alt = data.channel?.alternatives?.[0];
        const text = alt?.transcript ?? '';

        if (!text) return;

        sttLog('deepgram: got', data.is_final ? 'FINAL' : 'interim', `"${text}"`);

        const transcript: STTTranscript = {
          text,
          isFinal: data.is_final ?? false,
          confidence: alt?.confidence ?? 0,
          timestamp: Date.now(),
        };
        this.emitTranscript(transcript);
      } catch {
        // Non-JSON message, ignore
      }
    };

    this.ws.onerror = (event) => {
      if (this.suppressSocketEvents) return;
      sttLog('deepgram: WebSocket error', event);
      const err: STTError = {
        code: 'network',
        message: 'Deepgram WebSocket error',
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

  /** Send audio data to the Deepgram stream. Converts Float32 to Int16 (linear16). */
  sendAudio(data: ArrayBuffer | Int16Array | Float32Array): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    if (data instanceof Float32Array) {
      // Convert Float32 [-1, 1] to Int16 PCM (Deepgram expects linear16)
      const int16 = new Int16Array(data.length);
      for (let i = 0; i < data.length; i++) {
        const s = Math.max(-1, Math.min(1, data[i]!));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      this.ws.send(int16.buffer);
    } else if (data instanceof Int16Array) {
      this.ws.send(data.buffer);
    } else {
      this.ws.send(data);
    }
  }

  stop(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Send close message per Deepgram protocol
      this.ws.send(JSON.stringify({ type: 'CloseStream' }));
    }
    this.closeSocket(true);
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
