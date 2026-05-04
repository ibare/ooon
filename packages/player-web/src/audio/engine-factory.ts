import type { AudioEngine } from '@oon/shared';
import { SmplrAudioEngine } from '@oon/audio-engine-web';

export interface EngineFactoryOptions {
  /** 샘플 자원 base URL. 미지정 시 'samples' (host base 상대). */
  samplesBaseUrl?: string;
}

let instance: SmplrAudioEngine | null = null;
let initPromise: Promise<void> | null = null;

/** lazy 싱글톤 — 첫 재생 시점에 한 번만 생성/초기화된다. 호스트 주입 불필요. */
export async function getAudioEngine(opts: EngineFactoryOptions = {}): Promise<AudioEngine> {
  const base = opts.samplesBaseUrl ?? 'samples';
  if (!instance) {
    instance = new SmplrAudioEngine({
      pianoBaseUrl: `${base}/splendid-grand-piano`,
      drumKitUrl: `${base}/drum-machines/tr-808/dm.json`,
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
