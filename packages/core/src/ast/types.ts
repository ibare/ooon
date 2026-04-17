export interface TimeSignature {
  beats: number;
  beatValue: number;
}

export type DurationSymbol = 'w' | 'h' | 'q' | 'e' | 's' | 'w.' | 'h.' | 'q.' | 'e.' | 's.';

export interface NoteEvent {
  pitch: string;
  duration: DurationSymbol;
  beats: number;
  isRest: boolean;
}

export interface Bar<T> {
  barNumber: number;
  events: T[];
}

export interface ChordNode {
  type: 'chord';
  symbol: string;
  root: string;
  quality: string;
  intervals: readonly number[];
  notes: readonly string[];
  bass?: string;
}

export interface ScaleNode {
  type: 'scale';
  root: string;
  scaleType: string;
  notes: readonly string[];
  intervals: readonly number[];
}

export interface NoteNode {
  type: 'note';
  pitch: string;
  noteName: string;
  octave: number;
  midiNumber: number;
  frequency: number;
}

export type InlineNode = ChordNode | ScaleNode | NoteNode;

export interface ScoreBar {
  barNumber: number;
  notes: NoteEvent[];
}

export interface ScoreNode {
  type: 'score';
  timeSignature: TimeSignature;
  key?: string;
  bpm: number;
  bars: ScoreBar[];
  warnings: string[];
}

export type DrumTrackKey = 'HH' | 'SN' | 'KK' | 'TM' | 'CR' | 'RD';

export interface DrumNode {
  type: 'drum';
  timeSignature: TimeSignature;
  bpm: number;
  resolution: number;
  barCount: number;
  tracks: Partial<Record<DrumTrackKey, boolean[]>>;
  warnings: string[];
}

export interface ChordEventResolved {
  roman?: string;
  symbol: string;
  beats: number;
  root: string;
  quality: string;
  notes: readonly string[];
}

export interface ProgressionBar {
  barNumber: number;
  chords: ChordEventResolved[];
}

export interface ProgressionNode {
  type: 'progression';
  timeSignature: TimeSignature;
  key: string;
  mode: 'major' | 'minor';
  bpm: number;
  bars: ProgressionBar[];
  warnings: string[];
}

export interface FretDot {
  string: number;
  fret: number;
  note: string;
  isRoot: boolean;
  midiNote: number;
}

export interface FretboardNode {
  type: 'fretboard';
  scale: {
    root: string;
    scaleType: string;
    notes: readonly string[];
  };
  position?: number;
  fretRange: [number, number];
  tuning: number[];
  dots: FretDot[];
}

export interface SongBar {
  barNumber: number;
  chord: { symbol: string; notes: readonly string[]; beats: number };
  melody: NoteEvent[];
  drum?: Partial<Record<DrumTrackKey, boolean[]>>;
}

export interface SongNode {
  type: 'song';
  timeSignature: TimeSignature;
  key: string;
  bpm: number;
  beat?: string;
  barCount: number;
  bars: SongBar[];
  warnings: string[];
}

export type BlockNode = ScoreNode | DrumNode | ProgressionNode | FretboardNode | SongNode;
export type OonNode = InlineNode | BlockNode;
