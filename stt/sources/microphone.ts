import type { AudioSource } from '../types';

const CHUNK_SIZE = 4096;
const DEFAULT_SAMPLE_RATE = 16000;

/**
 * AudioSource that captures PCM audio from the device microphone
 * using getUserMedia and ScriptProcessorNode.
 */
export class MicrophoneSource implements AudioSource {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private listeners: Array<(pcm: Float32Array, sampleRate: number) => void> = [];

  async start(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        'getUserMedia not available — likely running in a WebView. ' +
        'Use glass-bridge source or pass a custom AudioSource instead.'
      );
    }

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { sampleRate: DEFAULT_SAMPLE_RATE, channelCount: 1 },
    });

    this.audioContext = new AudioContext({ sampleRate: DEFAULT_SAMPLE_RATE });
    this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);
    this.scriptNode = this.audioContext.createScriptProcessor(CHUNK_SIZE, 1, 1);

    this.scriptNode.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);
      // Copy the buffer — it's reused by the browser
      const chunk = new Float32Array(input.length);
      chunk.set(input);
      const rate = this.audioContext?.sampleRate ?? DEFAULT_SAMPLE_RATE;
      for (const cb of this.listeners) {
        cb(chunk, rate);
      }
    };

    this.sourceNode.connect(this.scriptNode);
    this.scriptNode.connect(this.audioContext.destination);
  }

  stop(): void {
    if (this.scriptNode) {
      this.scriptNode.onaudioprocess = null;
      this.scriptNode.disconnect();
      this.scriptNode = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        track.stop();
      }
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }

  onAudioData(cb: (pcm: Float32Array, sampleRate: number) => void): () => void {
    this.listeners.push(cb);
    return () => {
      const idx = this.listeners.indexOf(cb);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  dispose(): void {
    this.stop();
    this.listeners.length = 0;
  }
}
