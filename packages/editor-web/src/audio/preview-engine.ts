import { SmplrAudioEngine, type SmplrAudioEngineOptions } from '@oon/audio-engine-web';

// 노트 미리듣기용 단일 SmplrAudioEngine. 첫 호출 시 lazy init.
// peerDependency `smplr` 미설치/init 실패 시 onError 통지 후 silent fallback.
export class PreviewEngine {
  private engine: SmplrAudioEngine | null = null;
  private initPromise: Promise<void> | null = null;
  private failed = false;

  constructor(
    private readonly opts: SmplrAudioEngineOptions = {},
    private readonly onError?: (err: unknown) => void,
  ) {}

  async ensureReady(): Promise<boolean> {
    if (this.failed) return false;
    if (this.engine) return true;
    if (!this.initPromise) {
      this.initPromise = (async () => {
        try {
          const e = new SmplrAudioEngine(this.opts);
          await e.init();
          this.engine = e;
        } catch (err) {
          this.failed = true;
          if (this.onError) this.onError(err);
          else console.warn('[oon/editor-web] preview engine init failed', err);
        }
      })();
    }
    await this.initPromise;
    return !this.failed && this.engine !== null;
  }

  /** 짧은 prelisten — 4분음 길이로 단음을 재생한다. */
  async previewNote(pitch: string, duration: string = 'q'): Promise<void> {
    if (!(await this.ensureReady())) return;
    this.engine?.playNote(pitch, duration);
  }

  dispose(): void {
    this.engine?.dispose();
    this.engine = null;
  }
}
