import { describe, expect, it } from 'vitest';
import {
  BRAVURA_FONT_FAMILY,
  ENGRAVING,
  GLYPH_NAMES,
  GLYPHS,
} from '@ooon/smufl-asset';

describe('@ooon/smufl-asset', () => {
  it('모든 명세된 글리프가 GLYPHS에 존재한다', () => {
    for (const name of GLYPH_NAMES) {
      expect(GLYPHS[name], `missing glyph: ${name}`).toBeDefined();
    }
  });

  it('GLYPHS에 명세 외 키가 추가되지 않는다', () => {
    expect(Object.keys(GLYPHS).sort()).toEqual([...GLYPH_NAMES].sort());
  });

  it('codepoint는 SMuFL PUA 영역(U+E000..U+F8FF)에 있다', () => {
    for (const name of GLYPH_NAMES) {
      const cp = GLYPHS[name].codepoint;
      expect(cp, `${name}: codepoint out of PUA`).toBeGreaterThanOrEqual(0xe000);
      expect(cp, `${name}: codepoint out of PUA`).toBeLessThanOrEqual(0xf8ff);
    }
  });

  it('알려진 글리프의 codepoint가 SMuFL 명세와 일치한다', () => {
    expect(GLYPHS.gClef.codepoint).toBe(0xe050);
    expect(GLYPHS.fClef.codepoint).toBe(0xe062);
    expect(GLYPHS.noteheadBlack.codepoint).toBe(0xe0a4);
    expect(GLYPHS.noteheadWhole.codepoint).toBe(0xe0a2);
    expect(GLYPHS.flag8thUp.codepoint).toBe(0xe240);
    expect(GLYPHS.accidentalSharp.codepoint).toBe(0xe262);
    expect(GLYPHS.timeSig0.codepoint).toBe(0xe080);
    expect(GLYPHS.timeSig9.codepoint).toBe(0xe089);
    expect(GLYPHS.augmentationDot.codepoint).toBe(0xe1e7);
  });

  it('bbox가 좌하/우상 관계를 만족한다', () => {
    for (const name of GLYPH_NAMES) {
      const { bBoxNE, bBoxSW } = GLYPHS[name].bbox;
      expect(bBoxNE.x, `${name}: bbox.x`).toBeGreaterThanOrEqual(bBoxSW.x);
      expect(bBoxNE.y, `${name}: bbox.y`).toBeGreaterThanOrEqual(bBoxSW.y);
    }
  });

  it('advanceWidth는 양수이거나 0이다', () => {
    for (const name of GLYPH_NAMES) {
      expect(GLYPHS[name].advanceWidth, `${name}`).toBeGreaterThanOrEqual(0);
    }
  });

  it('notehead 글리프는 stem 부착 앵커를 갖는다', () => {
    for (const name of ['noteheadBlack', 'noteheadHalf'] as const) {
      const a = GLYPHS[name].anchors;
      expect(a.stemUpSE, `${name}.stemUpSE`).toBeDefined();
      expect(a.stemDownNW, `${name}.stemDownNW`).toBeDefined();
    }
  });

  it('flag 글리프는 stem 부착 앵커를 갖는다', () => {
    expect(GLYPHS.flag8thUp.anchors.stemUpNW).toBeDefined();
    expect(GLYPHS.flag8thDown.anchors.stemDownSW).toBeDefined();
    expect(GLYPHS.flag16thUp.anchors.stemUpNW).toBeDefined();
    expect(GLYPHS.flag16thDown.anchors.stemDownSW).toBeDefined();
  });

  it('ENGRAVING 기본값은 양의 sp 값이다', () => {
    expect(ENGRAVING.staffLineThickness).toBeGreaterThan(0);
    expect(ENGRAVING.stemThickness).toBeGreaterThan(0);
    expect(ENGRAVING.beamThickness).toBeGreaterThan(0);
    expect(ENGRAVING.beamSpacing).toBeGreaterThan(0);
    expect(ENGRAVING.legerLineThickness).toBeGreaterThan(0);
    expect(ENGRAVING.legerLineExtension).toBeGreaterThan(0);
  });

  it('BRAVURA_FONT_FAMILY 상수', () => {
    expect(BRAVURA_FONT_FAMILY).toBe('Bravura');
  });

  it('GLYPH_NAMES에 중복이 없다', () => {
    const set = new Set(GLYPH_NAMES);
    expect(set.size).toBe(GLYPH_NAMES.length);
  });
});
