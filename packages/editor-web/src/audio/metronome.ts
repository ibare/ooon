import {
  METRONOME_CLICK_DECAY_SEC,
  METRONOME_CLICK_FREQ_HZ,
  METRONOME_CLICK_GAIN,
} from '../constants.js';

// 외부 라이브러리 의존 없는 WebAudio 메트로놈 클릭.
// scheduleClicks(bpm, beats)은 한 마디 분량의 클릭을 스케줄링하고, 각 클릭 시점에 onTick(beatIndex) 콜백을 호출한다.
export class Metronome {
  private ctx: AudioContext | null = null;
  private cancelled = false;

  private getCtx(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const Ctor: typeof AudioContext | undefined =
        typeof window !== 'undefined'
          ? ((window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ??
            (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
          : undefined;
      if (!Ctor) throw new Error('@ooon/editor-web Metronome: WebAudio unavailable');
      this.ctx = new Ctor();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  /**
   * 한 마디 분량의 클릭을 즉시 스케줄링한다.
   * onTick은 각 박자 시점(WebAudio 정확)에 setTimeout으로 호출된다(시각 깜빡임 트리거용).
   */
  scheduleBar(bpm: number, beats: number, onTick?: (beatIndex: number) => void): void {
    this.cancelled = false;
    const ctx = this.getCtx();
    const beatSec = 60 / Math.max(1, bpm);
    const startTime = ctx.currentTime + 0.06;
    for (let i = 0; i < beats; i++) {
      if (this.cancelled) return;
      const t = startTime + i * beatSec;
      this.click(ctx, t, i === 0);
      if (onTick) {
        const delayMs = Math.max(0, (t - ctx.currentTime) * 1000);
        const idx = i;
        setTimeout(() => {
          if (!this.cancelled) onTick(idx);
        }, delayMs);
      }
    }
  }

  cancel(): void {
    this.cancelled = true;
  }

  private click(ctx: AudioContext, time: number, accent: boolean): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = accent ? METRONOME_CLICK_FREQ_HZ * 1.25 : METRONOME_CLICK_FREQ_HZ;
    osc.type = 'square';
    gain.gain.setValueAtTime(METRONOME_CLICK_GAIN * (accent ? 1.0 : 0.7), time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + METRONOME_CLICK_DECAY_SEC);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + METRONOME_CLICK_DECAY_SEC + 0.01);
  }

  dispose(): void {
    this.cancel();
    if (this.ctx && this.ctx.state !== 'closed') void this.ctx.close();
    this.ctx = null;
  }
}
