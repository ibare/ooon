import type { AudioEngine, DrumSample } from '@ooon/shared';
import { DrumMachine, SplendidGrandPiano, type Storage } from 'smplr';

// smplr 0.20.0은 sample 이름을 공백 형식("FF A#4")로 보존하고 fetch 직전에
// `%20`/`%23`로 인코딩해 storage에 넘긴다. 로컬 호스팅 시 정적 서버가 `%23`을
// fragment로 잘못 처리하는 이슈를 피하기 위해 파일명을 `공백→-`, `#→s`로
// 저장하므로(`FF-As4.ogg`), storage 단계에서 동일 매핑을 적용해 URL을 일치시킨다.
const sanitizingStorage: Storage = {
  fetch: (url) => fetch(url.replace(/%20/g, '-').replace(/%23/g, 's')),
};

export interface SmplrAudioEngineOptions {
  /** SplendidGrandPiano 샘플 호스팅 base URL. 미지정 시 smplr의 원격 기본값 사용. */
  pianoBaseUrl?: string;
  /** DrumMachine dm.json URL. 미지정 시 'TR-808'을 instrument로 사용해 원격에서 로드. */
  drumKitUrl?: string;
  /** 0–127 MIDI 스케일. 기본 100. */
  pianoVolume?: number;
  drumVolume?: number;
}

const QUARTER_SEC_AT_120 = 60 / 120;

const DRUM_GROUP: Record<DrumSample, string> = {
  kick: 'kick',
  snare: 'snare',
  'hihat-closed': 'hihat-close',
  'hihat-open': 'hihat-open',
  crash: 'cymbal',
  ride: 'cymbal',
  tom: 'mid-tom',
};

export class SmplrAudioEngine implements AudioEngine {
  private ready = false;
  private ctx: AudioContext | undefined;
  private piano: SplendidGrandPiano | undefined;
  private drums: DrumMachine | undefined;

  constructor(private readonly opts: SmplrAudioEngineOptions = {}) {}

  async init(): Promise<void> {
    if (this.ready) return;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') await ctx.resume();
    this.ctx = ctx;

    const piano = new SplendidGrandPiano(ctx, {
      baseUrl: this.opts.pianoBaseUrl,
      volume: this.opts.pianoVolume ?? 100,
      storage: this.opts.pianoBaseUrl ? sanitizingStorage : undefined,
    });
    const drums = this.opts.drumKitUrl
      ? new DrumMachine(ctx, { url: this.opts.drumKitUrl, volume: this.opts.drumVolume ?? 100 })
      : new DrumMachine(ctx, { instrument: 'TR-808', volume: this.opts.drumVolume ?? 100 });

    await Promise.all([piano.load, drums.load]);
    this.piano = piano;
    this.drums = drums;
    this.ready = true;
  }

  isReady(): boolean {
    return this.ready;
  }

  playNote(pitch: string, duration: string, time?: number): void {
    if (!this.piano) return;
    this.piano.start({ note: pitch, time, duration: durationToSec(duration) });
  }

  playChord(pitches: string[], duration: string, time?: number): void {
    if (!this.piano) return;
    const sec = durationToSec(duration);
    for (const note of pitches) {
      this.piano.start({ note, time, duration: sec });
    }
  }

  playDrum(sample: DrumSample, time?: number): void {
    if (!this.drums) return;
    this.drums.start({ note: DRUM_GROUP[sample], time });
  }

  now(): number {
    return this.ctx?.currentTime ?? 0;
  }

  scheduleAt(time: number, callback: () => void): void {
    const ctx = this.ctx;
    if (!ctx) {
      callback();
      return;
    }
    const delaySec = Math.max(0, time - ctx.currentTime);
    setTimeout(callback, delaySec * 1000);
  }

  dispose(): void {
    this.piano?.stop();
    this.drums?.stop({});
    void this.ctx?.close();
    this.piano = undefined;
    this.drums = undefined;
    this.ctx = undefined;
    this.ready = false;
  }
}

function durationToSec(duration: string): number {
  const dotted = duration.endsWith('.');
  const base = dotted ? duration.slice(0, -1) : duration;
  const beats = baseToBeats(base);
  const sec = beats * QUARTER_SEC_AT_120;
  return dotted ? sec * 1.5 : sec;
}

function baseToBeats(base: string): number {
  switch (base) {
    case 'w':
      return 4;
    case 'h':
      return 2;
    case 'q':
      return 1;
    case 'e':
      return 0.5;
    case 's':
      return 0.25;
    default:
      return 1;
  }
}
