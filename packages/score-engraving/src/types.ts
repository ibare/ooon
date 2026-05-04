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
  /** 영역의 좌측 x — hit area 등 박자표 영역 시작점으로 쓴다. */
  x: number;
  /** 영역의 가로 중심 cx — 분자/분모 글리프 폭이 달라도 동일 기준으로 가운데 정렬하기 위한 좌표. */
  cx: number;
  topGlyph: string;
  topY: number;
  bottomGlyph: string;
  bottomY: number;
}

// 한 head(노트헤드) 한 점. 화음(>=2 head) 표현을 1급으로 둔다.
//   - x = note.x + xOffset  (head shift는 stem 방향 + 인접 2도 규칙으로 결정)
//   - y = staff line/space 좌표
//   - accidental은 head별로 결정(같은 column에 layered 배치는 spacing/accidentals 패스 책임)
//   - ledgerLines는 head별. 화음 양 끝 사이의 line은 한 head에서만 그리면 충분하지만 중복은
//     렌더 측이 dedup하지 않아도 시각적으로 동일하므로 단순화.
export interface ScoreHeadLayout {
  pitch: string;
  midi: number;
  y: number;
  xOffset: number;
  headGlyph: string;
  accidental?: ScoreGlyph;
  ledgerLines: { x1: number; x2: number; y: number }[];
}

// 한 박자 슬롯의 음 레이아웃. 단음=heads.length===1, 화음=>=2, 쉼표=heads.length===0.
// stem/flag/dots는 화음 전체에 한 개. 쉼표는 별도 글리프(restGlyph + restY)로 표현한다.
export interface ScoreNoteLayout {
  barNumber: number;
  noteIndex: number;
  x: number;
  beats: number;
  isRest: boolean;
  heads: ScoreHeadLayout[];
  // 쉼표는 head 대신 별도 글리프 — heads.length === 0 && isRest일 때만 사용.
  restGlyph?: string;
  restY?: number;
  stem?: { x: number; y1: number; y2: number };
  flag?: ScoreGlyph;
  dots: { x: number; y: number }[];
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

export interface ScoreSystemLayout {
  index: number;
  // 시스템 시작 y (= staff 영역 top 기준이 아니라 system 단락 좌상단)
  y: number;
  height: number;
  staff: ScoreStaff;
  clef: ScoreGlyph;
  // 조표 글리프 배열. 키가 C/Am처럼 변화 없으면 빈 배열.
  keySig: ScoreGlyph[];
  timeSig: ScoreTimeSig;
  bars: ScoreBarLayout[];
  contentStart: number;
}

export interface ScoreLayout extends LayoutBase {
  systems: ScoreSystemLayout[];
}

