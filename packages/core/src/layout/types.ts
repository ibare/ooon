export interface LayoutBase {
  width: number;
  height: number;
}

export interface ScoreStaff {
  y: number;
  top: number;
  bottom: number;
  lineGap: number;
  lines: number[];
}

export interface ScoreGlyph {
  x: number;
  y: number;
  glyph: string;
}

export interface ScoreTimeSig {
  x: number;
  topGlyph: string;
  topY: number;
  bottomGlyph: string;
  bottomY: number;
}

export interface ScoreNoteLayout {
  barNumber: number;
  noteIndex: number;
  x: number;
  y: number;
  headGlyph: string;
  beats: number;
  isRest: boolean;
  pitch: string;
  midi: number;
  stem?: { x: number; y1: number; y2: number };
  flag?: ScoreGlyph;
  dots: { x: number; y: number }[];
  ledgerLines: { x1: number; x2: number; y: number }[];
  accidental?: ScoreGlyph;
}

export interface ScoreBarLayout {
  barNumber: number;
  x: number;
  width: number;
  barlineX: number;
  notes: ScoreNoteLayout[];
}

export interface ScoreLayout extends LayoutBase {
  staff: ScoreStaff;
  clef: ScoreGlyph;
  timeSig: ScoreTimeSig;
  bars: ScoreBarLayout[];
  contentStart: number;
  playheadX?: number;
}

export interface KeyLayout {
  midi: number;
  isBlack: boolean;
  rect: { x: number; y: number; width: number; height: number };
  label?: string;
  highlighted?: boolean;
}

export interface KeyboardLayout extends LayoutBase {
  keys: KeyLayout[];
  lowMidi: number;
  highMidi: number;
}

export interface FretboardStringLine {
  stringIndex: number;
  y: number;
}

export interface FretboardFretLine {
  fret: number;
  x: number;
}

export interface FretboardDotLayout {
  string: number;
  fret: number;
  x: number;
  y: number;
  note: string;
  isRoot: boolean;
  midi: number;
}

export interface FretboardLayout extends LayoutBase {
  strings: FretboardStringLine[];
  frets: FretboardFretLine[];
  dots: FretboardDotLayout[];
  fretLabels: { fret: number; x: number; y: number }[];
  nutX?: number;
}

export interface DrumCellLayout {
  track: string;
  trackIndex: number;
  barIndex: number;
  cellIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
}

export interface DrumLayout extends LayoutBase {
  tracks: { name: string; y: number; height: number; label: string }[];
  cells: DrumCellLayout[];
  barDividers: { x: number; yTop: number; yBottom: number }[];
  beatDividers: { x: number; yTop: number; yBottom: number }[];
}

export interface ProgressionCardLayout {
  barNumber: number;
  rect: { x: number; y: number; width: number; height: number };
  chords: {
    roman?: string;
    symbol: string;
    notes: readonly string[];
    beats: number;
    rect: { x: number; y: number; width: number; height: number };
  }[];
}

export interface ProgressionLayout extends LayoutBase {
  cards: ProgressionCardLayout[];
  cols: number;
  rows: number;
}

export interface SongLayout extends LayoutBase {
  chordRow: { y: number; height: number; cards: ProgressionCardLayout[] };
  scoreRow: { y: number; height: number; score: ScoreLayout };
  drumRow?: { y: number; height: number; drum: DrumLayout };
}
