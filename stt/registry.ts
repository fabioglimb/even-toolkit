import type { STTProvider } from './types';

export async function createProvider(type: string): Promise<STTProvider> {
  switch (type) {
    case 'whisper-api': {
      const { WhisperApiProvider } = await import('./providers/whisper-api');
      return new WhisperApiProvider();
    }
    case 'deepgram': {
      const { DeepgramProvider } = await import('./providers/deepgram');
      return new DeepgramProvider();
    }
    default:
      throw new Error(`Unknown STT provider: ${type}`);
  }
}
