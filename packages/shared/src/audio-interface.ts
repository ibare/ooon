export type NoteDuration = 'w' | 'h' | 'q' | 'e' | 's' | `${'w' | 'h' | 'q' | 'e' | 's'}.`;

export type DrumSample =
  | 'kick'
  | 'snare'
  | 'hihat-closed'
  | 'hihat-open'
  | 'crash'
  | 'ride'
  | 'tom';

export interface AudioEngine {
  init(): Promise<void>;
  isReady(): boolean;

  playNote(pitch: string, duration: string, time?: number): void;
  playChord(pitches: string[], duration: string, time?: number): void;

  playDrum(sample: DrumSample, time?: number): void;

  now(): number;
  scheduleAt(time: number, callback: () => void): void;

  dispose(): void;
}
