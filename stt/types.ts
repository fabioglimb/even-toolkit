// ── STT Provider Types ──

export type STTProviderType = 'whisper-api' | 'deepgram' | string;
export type STTMode = 'streaming' | 'batch';
export type STTState = 'idle' | 'loading' | 'listening' | 'processing' | 'error';

export interface STTTranscript {
  text: string;
  isFinal: boolean;
  confidence: number;
  language?: string;
  timestamp: number;
}

export interface STTProviderConfig {
  language?: string;          // BCP 47 tag, default 'en-US'
  mode?: STTMode;
  apiKey?: string;
  modelId?: string;
  continuous?: boolean;
  vadEnabled?: boolean;
  vadSilenceMs?: number;      // default 1500
  sampleRate?: number;        // default 16000
  maxDurationMs?: number;
}

export interface STTError {
  code: 'not-allowed' | 'no-speech' | 'network' | 'model-load' | 'aborted' | 'unsupported' | 'unknown';
  message: string;
  provider: STTProviderType;
}

export interface STTProvider {
  readonly type: STTProviderType;
  readonly supportedModes: STTMode[];
  readonly state: STTState;

  init(config: STTProviderConfig): Promise<void>;
  start(): void;
  stop(): void;
  abort(): void;
  dispose(): void;

  onTranscript(cb: (t: STTTranscript) => void): () => void;
  onStateChange(cb: (s: STTState) => void): () => void;
  onError(cb: (e: STTError) => void): () => void;

  /** Batch mode: feed raw audio for transcription */
  transcribe?(audio: Float32Array, sampleRate: number): Promise<STTTranscript>;
}

// ── Audio Source Types ──

export interface AudioSource {
  start(): Promise<void>;
  stop(): void;
  onAudioData(cb: (pcm: Float32Array, sampleRate: number) => void): () => void;
  dispose(): void;
}

// ── Engine Config ──

export interface STTEngineConfig {
  provider: STTProviderType;
  source?: 'microphone' | 'glass-bridge' | AudioSource;
  language?: string;
  mode?: STTMode;
  apiKey?: string;
  modelId?: string;
  continuous?: boolean;
  vad?: boolean | { silenceMs?: number; thresholdDb?: number };
  sampleRate?: number;
  chunkIntervalMs?: number;
  fallback?: STTProviderType;
}

// ── React Hook Types ──

export interface UseSTTConfig {
  provider?: STTProviderType;
  source?: 'microphone' | 'glass-bridge';
  language?: string;
  mode?: STTMode;
  apiKey?: string;
  modelId?: string;
  continuous?: boolean;
  vad?: boolean | { silenceMs?: number; thresholdDb?: number };
  chunkIntervalMs?: number;
  autoStart?: boolean;
  fallback?: STTProviderType;
  onTranscript?: (text: string, isFinal: boolean) => void;
}

export interface UseSTTReturn {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  isLoading: boolean;
  error: STTError | null;
  state: STTState;
  start: () => Promise<void>;
  stop: () => void;
  abort: () => void;
  reset: () => void;
}
