import type { AudioEngine } from '@oon/shared';
import { SmplrAudioEngine } from '@oon/projector-web';

const BASE = import.meta.env.BASE_URL;
const PIANO_BASE_URL = `${BASE}samples/splendid-grand-piano`;
const DRUM_KIT_URL = `${BASE}samples/drum-machines/tr-808/dm.json`;

let instance: SmplrAudioEngine | null = null;
let initPromise: Promise<void> | null = null;

export async function getAudioEngine(): Promise<AudioEngine> {
  if (!instance) {
    instance = new SmplrAudioEngine({
      pianoBaseUrl: PIANO_BASE_URL,
      drumKitUrl: DRUM_KIT_URL,
    });
  }
  if (!instance.isReady()) {
    if (!initPromise) {
      initPromise = instance.init();
    }
    await initPromise;
  }
  return instance;
}
