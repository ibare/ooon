export type NoteDuration = 'w' | 'h' | 'q' | 'e' | 's' | `${'w' | 'h' | 'q' | 'e' | 's'}.`;

export interface AudioEngine {
  init(): Promise<void>;
  isReady(): boolean;

  playNote(pitch: string, duration: string, time?: number): void;
  playChord(pitches: string[], duration: string, time?: number): void;

  playKick(time?: number): void;
  playSnare(time?: number): void;
  playHihat(time?: number): void;

  now(): number;
  scheduleAt(time: number, callback: () => void): void;

  dispose(): void;
}
