export type IntervalQuality = 'P' | 'M' | 'm' | 'A' | 'd';

export interface Interval {
  semitones: number;
  quality: IntervalQuality;
  number: number;
  name: string;
}

export const INTERVALS: Record<string, Interval> = {
  P1: { semitones: 0, quality: 'P', number: 1, name: 'unison' },
  m2: { semitones: 1, quality: 'm', number: 2, name: 'minor 2nd' },
  M2: { semitones: 2, quality: 'M', number: 2, name: 'major 2nd' },
  m3: { semitones: 3, quality: 'm', number: 3, name: 'minor 3rd' },
  M3: { semitones: 4, quality: 'M', number: 3, name: 'major 3rd' },
  P4: { semitones: 5, quality: 'P', number: 4, name: 'perfect 4th' },
  A4: { semitones: 6, quality: 'A', number: 4, name: 'augmented 4th' },
  d5: { semitones: 6, quality: 'd', number: 5, name: 'diminished 5th' },
  P5: { semitones: 7, quality: 'P', number: 5, name: 'perfect 5th' },
  A5: { semitones: 8, quality: 'A', number: 5, name: 'augmented 5th' },
  m6: { semitones: 8, quality: 'm', number: 6, name: 'minor 6th' },
  M6: { semitones: 9, quality: 'M', number: 6, name: 'major 6th' },
  m7: { semitones: 10, quality: 'm', number: 7, name: 'minor 7th' },
  M7: { semitones: 11, quality: 'M', number: 7, name: 'major 7th' },
  P8: { semitones: 12, quality: 'P', number: 8, name: 'octave' },
  m9: { semitones: 13, quality: 'm', number: 9, name: 'minor 9th' },
  M9: { semitones: 14, quality: 'M', number: 9, name: 'major 9th' },
};

export function semitonesBetween(lowMidi: number, highMidi: number): number {
  return highMidi - lowMidi;
}
