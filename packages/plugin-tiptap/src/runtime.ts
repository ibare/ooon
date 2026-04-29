import type { AudioEngine } from '@oon/shared';
import { CanvasProjector, SmplrAudioEngine, loadBravura } from '@oon/projector-web';

export interface OonRuntimeOptions {
  bravuraUrl?: string;
  createAudioEngine?: () => AudioEngine;
  autoLoadFont?: boolean;
}

export class OonRuntime {
  private readonly opts: OonRuntimeOptions;
  private audio: AudioEngine | undefined;
  private fontPromise: Promise<void> | undefined;
  private readonly projectors = new Set<CanvasProjector>();

  constructor(opts: OonRuntimeOptions = {}) {
    this.opts = opts;
    if (opts.autoLoadFont !== false && opts.bravuraUrl) {
      this.loadFont();
    }
  }

  createProjector(canvas: HTMLCanvasElement): CanvasProjector {
    const projector = new CanvasProjector(canvas);
    this.projectors.add(projector);
    return projector;
  }

  releaseProjector(projector: CanvasProjector): void {
    this.projectors.delete(projector);
  }

  loadFont(): Promise<void> {
    if (this.fontPromise) return this.fontPromise;
    const url = this.opts.bravuraUrl;
    if (!url) return Promise.resolve();
    this.fontPromise = loadBravura({ url }).then(() => undefined);
    return this.fontPromise;
  }

  async getAudioEngine(): Promise<AudioEngine> {
    if (!this.audio) {
      this.audio = this.opts.createAudioEngine ? this.opts.createAudioEngine() : new SmplrAudioEngine();
    }
    if (!this.audio.isReady()) {
      await this.audio.init();
    }
    return this.audio;
  }

  hasAudioEngine(): boolean {
    return this.audio !== undefined;
  }

  dispose(): void {
    this.audio?.dispose();
    this.audio = undefined;
    this.projectors.clear();
    this.fontPromise = undefined;
  }
}
