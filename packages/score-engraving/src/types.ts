import type { LayoutBase } from '@oon/core';

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

export interface ScoreBeamLine {
  x1: number;
  x2: number;
  y: number;
  thickness: number;
}

export interface ScoreBeam {
  barNumber: number;
  noteIndices: number[];
  // 빔 본선과 보조선 좌표(8분=1줄, 16분=2줄). 모두 px 단위.
  lines: ScoreBeamLine[];
}

export interface ScoreBarLayout {
  barNumber: number;
  x: number;
  width: number;
  barlineX: number;
  notes: ScoreNoteLayout[];
  // 빔 그룹. 빔이 없는 마디라도 빈 배열로 항상 존재한다.
  beams: ScoreBeam[];
}

export interface ScoreLayout extends LayoutBase {
  staff: ScoreStaff;
  clef: ScoreGlyph;
  // 조표 글리프 배열. 키가 C/Am처럼 변화 없으면 빈 배열.
  keySig: ScoreGlyph[];
  timeSig: ScoreTimeSig;
  bars: ScoreBarLayout[];
  contentStart: number;
  playheadX?: number;
}

