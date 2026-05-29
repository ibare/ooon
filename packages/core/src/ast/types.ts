export interface TimeSignature {
  beats: number;
  beatValue: number;
}

export type DurationSymbol = 'w' | 'h' | 'q' | 'e' | 's' | 'w.' | 'h.' | 'q.' | 'e.' | 's.';

// 한 박자 슬롯에 들어가는 음 사건. 화음을 1급으로 표현하기 위해 pitches 배열로 단일화한다.
//   - 쉼표: pitches.length === 0, isRest === true
//   - 단음: pitches.length === 1, isRest === false
//   - 화음: pitches.length >= 2, isRest === false (모든 pitch가 같은 길이/박자에 동시 발음)
// pitches는 사용자 입력 순서를 보존한다(정렬은 score-engraving 패스에서 수행).
export interface NoteEvent {
  pitches: readonly string[];
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

export interface SongChord {
  symbol: string;
  root: string;
  quality: string;
  intervals: readonly number[];
  notes: readonly string[];
  bass?: string;
  beats: number;
}

export interface SongBar {
  barNumber: number;
  chord: SongChord;
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
export type OoonNode = InlineNode | BlockNode;
