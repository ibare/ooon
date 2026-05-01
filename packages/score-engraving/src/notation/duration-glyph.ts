import { GLYPHS, type GlyphName } from '@oon/smufl-asset';
import { SMUFL, type DurationSymbol } from '@oon/core';

// ─────────────────────────────────────────────────────────────────────────────
// duration symbol 기반 시각 분기.
//
// 시각적 음표 종류(흰 머리/검은 머리, stem 유무, flag 종류, 점 유무, 쉼표 모양)는
// 박자표와 무관한 invariant이며, 항상 DurationSymbol('w', 'h', 'q', 'e', 's',
// 'w.', 'h.', 'q.', 'e.', 's.')에서 결정된다. note.beats는 박자표(beatValue)에
// 따라 같은 음표가 다른 값을 갖기 때문에 시각 분기에 사용해서는 안 된다.
//   예) 4/4의 q → beats=1, 3/8의 q → beats=2 (하지만 둘 다 검은 머리 + flag 없음)
// ─────────────────────────────────────────────────────────────────────────────

type BaseDuration = 'w' | 'h' | 'q' | 'e' | 's';

export function isDotted(d: DurationSymbol): boolean {
  return d.endsWith('.');
}

export function baseDuration(d: DurationSymbol): BaseDuration {
  return (isDotted(d) ? d.slice(0, -1) : d) as BaseDuration;
}

export type NoteheadGlyph =
  | Extract<GlyphName, 'noteheadWhole' | 'noteheadHalf' | 'noteheadBlack'>;

export function noteheadGlyphName(d: DurationSymbol): NoteheadGlyph {
  switch (baseDuration(d)) {
    case 'w':
      return 'noteheadWhole';
    case 'h':
      return 'noteheadHalf';
    default:
      return 'noteheadBlack';
  }
}

export function noteheadAdvanceSp(d: DurationSymbol): number {
  return GLYPHS[noteheadGlyphName(d)].advanceWidth;
}

// 쉼표 글리프 이름 — duration symbol에 1:1로 대응한다(점쉼표는 base와 동일 글리프 + dot).
export function restGlyphName(d: DurationSymbol):
  | 'restWhole'
  | 'restHalf'
  | 'restQuarter'
  | 'rest8th'
  | 'rest16th' {
  switch (baseDuration(d)) {
    case 'w':
      return 'restWhole';
    case 'h':
      return 'restHalf';
    case 'q':
      return 'restQuarter';
    case 'e':
      return 'rest8th';
    case 's':
      return 'rest16th';
  }
}

export function restGlyphChar(d: DurationSymbol): string {
  return SMUFL[restGlyphName(d)];
}

export function restAdvanceSp(d: DurationSymbol): number {
  return GLYPHS[restGlyphName(d)].advanceWidth;
}

// stem은 온음표(점온음표 포함)에서만 생략된다.
export function noteHasStem(d: DurationSymbol): boolean {
  return baseDuration(d) !== 'w';
}

// flag 종류. beam 그룹에 묶인 경우 호출자가 무시한다.
export type FlagKind = '8th' | '16th' | null;

export function flagKind(d: DurationSymbol): FlagKind {
  switch (baseDuration(d)) {
    case 'e':
      return '8th';
    case 's':
      return '16th';
    default:
      return null;
  }
}
