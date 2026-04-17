import type { AudioEngine } from '@oon/shared';
import * as Tone from 'tone';

export interface ToneAudioEngineOptions {
  melodyVolume?: number;
  drumVolume?: number;
}

export class ToneAudioEngine implements AudioEngine {
  private ready = false;
  private melodySynth: Tone.PolySynth | undefined;
  private kick: Tone.MembraneSynth | undefined;
  private snare: Tone.NoiseSynth | undefined;
  private hihat: Tone.MetalSynth | undefined;

  constructor(private readonly opts: ToneAudioEngineOptions = {}) {}

  async init(): Promise<void> {
    if (this.ready) return;
    await Tone.start();
    const melodyVol = this.opts.melodyVolume ?? -6;
    const drumVol = this.opts.drumVolume ?? -8;

    this.melodySynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.01, decay: 0.15, sustain: 0.4, release: 0.4 },
    }).toDestination();
    this.melodySynth.volume.value = melodyVol;

    this.kick = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 6,
      envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 },
    }).toDestination();
    this.kick.volume.value = drumVol;

    this.snare = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.15, sustain: 0 },
    }).toDestination();
    this.snare.volume.value = drumVol;

    this.hihat = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.08, release: 0.02 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
    }).toDestination();
    this.hihat.volume.value = drumVol - 6;

    this.ready = true;
  }

  isReady(): boolean {
    return this.ready;
  }

  playNote(pitch: string, duration: string, time?: number): void {
    if (!this.melodySynth) return;
    this.melodySynth.triggerAttackRelease(pitch, toToneDuration(duration), time);
  }

  playChord(pitches: string[], duration: string, time?: number): void {
    if (!this.melodySynth || pitches.length === 0) return;
    this.melodySynth.triggerAttackRelease(pitches, toToneDuration(duration), time);
  }

  playKick(time?: number): void {
    this.kick?.triggerAttackRelease('C2', '8n', time);
  }

  playSnare(time?: number): void {
    this.snare?.triggerAttackRelease('16n', time);
  }

  playHihat(time?: number): void {
    if (!this.hihat) return;
    if (time !== undefined) this.hihat.triggerAttackRelease('32n', time);
    else this.hihat.triggerAttackRelease('32n', Tone.now());
  }

  now(): number {
    return Tone.now();
  }

  scheduleAt(time: number, callback: () => void): void {
    Tone.getTransport().scheduleOnce(() => callback(), time);
  }

  dispose(): void {
    this.melodySynth?.dispose();
    this.kick?.dispose();
    this.snare?.dispose();
    this.hihat?.dispose();
    this.melodySynth = undefined;
    this.kick = undefined;
    this.snare = undefined;
    this.hihat = undefined;
    this.ready = false;
  }
}

function toToneDuration(duration: string): string {
  const dotted = duration.endsWith('.');
  const base = dotted ? duration.slice(0, -1) : duration;
  const map: Record<string, string> = {
    w: '1n',
    h: '2n',
    q: '4n',
    e: '8n',
    s: '16n',
  };
  const mapped = map[base];
  if (!mapped) return duration;
  return dotted ? `${mapped}.` : mapped;
}
