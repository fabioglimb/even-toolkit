import type { AudioSource } from '../types';
import { sttLog } from '../debug';

const GLASS_SAMPLE_RATE = 16000;

/**
 * AudioSource for G2 smart glasses.
 *
 * Automatically opens/closes the glasses microphone via the EvenHub SDK bridge
 * and listens for PCM audio chunks from `audioEvent.audioPcm`.
 *
 * Usage:
 *   const source = new GlassBridgeSource();
 *   // It auto-detects the bridge from window.__evenBridge
 */
export class GlassBridgeSource implements AudioSource {
  private listeners: Array<(pcm: Float32Array, sampleRate: number) => void> = [];
  private listening = false;
  private bridge: any = null;

  async start(): Promise<void> {
    if (this.listening) return;

    // Get bridge from global (set by useGlasses)
    this.bridge = (window as any).__evenBridge ?? null;
    sttLog('GlassBridgeSource.start()', 'bridge found:', !!this.bridge);

    if (!this.bridge) {
      throw new Error(
        'Glasses bridge not available. Make sure useGlasses is mounted and __evenBridge is set.'
      );
    }

    this.listening = true;

    // Open the glasses microphone
    try {
      if (this.bridge.rawBridge?.audioControl) {
        sttLog('GlassBridgeSource', 'calling audioControl(true)');
        await this.bridge.rawBridge.audioControl(true);
        sttLog('GlassBridgeSource', 'audioControl(true) succeeded');
      } else if (this.bridge.rawBridge?.callEvenApp) {
        sttLog('GlassBridgeSource', 'calling callEvenApp("audioControl", {isOpen: true})');
        await this.bridge.rawBridge.callEvenApp('audioControl', { isOpen: true });
        sttLog('GlassBridgeSource', 'callEvenApp audioControl succeeded');
      } else {
        sttLog('GlassBridgeSource', 'WARNING: no audioControl method found on bridge');
      }
    } catch (err) {
      sttLog('GlassBridgeSource', 'audioControl(true) error:', err);
    }

    // Listen for audio PCM events
    this.bridge.onEvent((event: any) => {
      if (!this.listening) return;
      const audioPcm = event?.audioEvent?.audioPcm;
      if (!audioPcm || audioPcm.length === 0) return;

      sttLog('GlassBridgeSource', 'got audioPcm chunk, bytes:', audioPcm.length);

      // Convert Uint8Array (16-bit PCM little-endian) to Float32Array
      const float32 = pcm16ToFloat32(audioPcm);

      for (const cb of this.listeners) {
        cb(float32, GLASS_SAMPLE_RATE);
      }
    });
  }

  stop(): void {
    sttLog('GlassBridgeSource.stop()');
    this.listening = false;

    // Close the glasses microphone
    if (this.bridge) {
      try {
        if (this.bridge.rawBridge?.audioControl) {
          this.bridge.rawBridge.audioControl(false);
        } else if (this.bridge.rawBridge?.callEvenApp) {
          this.bridge.rawBridge.callEvenApp('audioControl', { isOpen: false });
        }
      } catch (err) {
        sttLog('GlassBridgeSource', 'audioControl(false) error:', err);
      }
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

/** Convert raw bytes (16-bit PCM little-endian) to Float32Array */
function pcm16ToFloat32(bytes: Uint8Array): Float32Array {
  const samples = bytes.length / 2;
  const float32 = new Float32Array(samples);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let i = 0; i < samples; i++) {
    float32[i] = view.getInt16(i * 2, true) / 32768;
  }
  return float32;
}
