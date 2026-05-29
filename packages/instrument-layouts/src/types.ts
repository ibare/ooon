import type { LayoutBase } from '@ooon/core';

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
  /** 한 마디당 cell 수. */
  resolution: number;
  /** 한 마디의 beat 수. cell의 시간 좌표 환산에 사용. */
  beatsPerBar: number;
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
}
