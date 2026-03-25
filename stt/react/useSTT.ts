import { useState, useRef, useEffect, useCallback } from 'react';
import type { UseSTTConfig, UseSTTReturn, STTState, STTError } from '../types';
import { STTEngine } from '../engine';
import { sttLog } from '../debug';

export function useSTT(config: UseSTTConfig = {}): UseSTTReturn {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<STTError | null>(null);
  const [state, setState] = useState<STTState>('idle');

  const engineRef = useRef<STTEngine | null>(null);
  const busyRef = useRef(false); // prevent start/stop race
  const configRef = useRef(config);
  configRef.current = config;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  const start = useCallback(async () => {
    if (busyRef.current) {
      sttLog('useSTT: start() blocked — busy');
      return;
    }
    busyRef.current = true;

    engineRef.current?.dispose();

    const cfg = configRef.current;

    sttLog('useSTT: start()', cfg.provider, 'apiKey?', !!cfg.apiKey);
    const engine = new STTEngine({
      provider: cfg.provider ?? 'whisper-api',
      source: cfg.source,
      language: cfg.language,
      mode: cfg.mode,
      apiKey: cfg.apiKey,
      modelId: cfg.modelId,
      continuous: cfg.continuous,
      vad: cfg.vad ?? true,
      chunkIntervalMs: cfg.chunkIntervalMs,
      fallback: cfg.fallback,
    });

    engineRef.current = engine;

    // Accumulate final results for streaming providers
    let accumulated = '';

    engine.onTranscript((t) => {
      if (t.isFinal) {
        // Append final to accumulated text
        const clean = t.text.replace(/\.+$/, '').trim();
        if (clean) {
          accumulated = accumulated ? accumulated + ' ' + clean : clean;
        }
        setTranscript(accumulated);
        setInterimTranscript('');
      } else {
        // Interim: show accumulated + current interim
        const clean = t.text.replace(/\.+$/, '').trim();
        const full = accumulated ? accumulated + ' ' + clean : clean;
        setInterimTranscript(full);
        setTranscript(full);
      }
      cfg.onTranscript?.(t.text, t.isFinal);
    });

    engine.onStateChange((s) => {
      setState(s);
      setIsListening(s === 'listening');
      setIsLoading(s === 'loading');
      if (s === 'idle' || s === 'error') {
        setInterimTranscript('');
        busyRef.current = false;
      }
    });

    engine.onError((e) => {
      setError(e);
      busyRef.current = false;
    });

    setError(null);
    try {
      await engine.start();
      busyRef.current = false;
    } catch {
      busyRef.current = false;
    }
  }, []);

  const stop = useCallback(() => {
    sttLog('useSTT: stop()');
    if (!engineRef.current) return;
    // Stop mic immediately, then engine handles final transcription
    engineRef.current.stop();
  }, []);

  const abort = useCallback(() => {
    sttLog('useSTT: abort()');
    engineRef.current?.abort();
    busyRef.current = false;
  }, []);

  const reset = useCallback(() => {
    sttLog('useSTT: reset()');
    engineRef.current?.abort();
    engineRef.current = null;
    busyRef.current = false;
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    setState('idle');
    setIsListening(false);
    setIsLoading(false);
  }, []);

  // Auto-start if configured
  useEffect(() => {
    if (config.autoStart) {
      start();
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    transcript,
    interimTranscript,
    isListening,
    isLoading,
    error,
    state,
    start,
    stop,
    abort,
    reset,
  };
}
