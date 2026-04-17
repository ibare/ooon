import type { AudioEngine } from '@oon/shared';
import { ToneAudioEngine } from '@oon/projector-web';

let instance: ToneAudioEngine | null = null;
let initPromise: Promise<void> | null = null;

export async function getAudioEngine(): Promise<AudioEngine> {
  if (!instance) {
    instance = new ToneAudioEngine();
  }
  if (!instance.isReady()) {
    if (!initPromise) {
      initPromise = instance.init();
    }
    await initPromise;
  }
  return instance;
}
