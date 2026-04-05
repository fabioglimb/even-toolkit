import type { STTProvider } from './types';

export async function createProvider(type: string): Promise<STTProvider> {
  switch (type) {
    case 'soniox': {
      const { SonioxProvider } = await import('./providers/soniox');
      return new SonioxProvider();
    }
    default:
      throw new Error(`Unknown STT provider: ${type}`);
  }
}
