import { describe, expect, it } from 'vitest';
import { BRAVURA_FONT_FAMILY, SMUFL } from './smufl.js';

describe('SMUFL', () => {
  it('glyph constants lie in SMuFL private use area (E000-F8FF)', () => {
    const codepoints = [
      SMUFL.gClef,
      SMUFL.fClef,
      SMUFL.cClef,
      SMUFL.noteheadWhole,
      SMUFL.noteheadHalf,
      SMUFL.noteheadBlack,
      SMUFL.flag8thUp,
      SMUFL.flag8thDown,
      SMUFL.flag16thUp,
      SMUFL.flag16thDown,
      SMUFL.restWhole,
      SMUFL.restHalf,
      SMUFL.restQuarter,
      SMUFL.rest8th,
      SMUFL.rest16th,
      SMUFL.augmentationDot,
      SMUFL.accidentalSharp,
      SMUFL.accidentalFlat,
      SMUFL.accidentalNatural,
    ];
    for (const ch of codepoints) {
      const cp = ch.codePointAt(0) ?? 0;
      expect(cp).toBeGreaterThanOrEqual(0xe000);
      expect(cp).toBeLessThanOrEqual(0xf8ff);
    }
  });

  it('timeSigNumber returns single codepoint at 0xE080 + n for one-digit n', () => {
    for (let n = 0; n <= 9; n++) {
      expect(SMUFL.timeSigNumber(n).codePointAt(0)).toBe(0xe080 + n);
      expect(SMUFL.timeSigNumber(n).length).toBe(1);
    }
  });

  it('timeSigNumber composes multi-digit numbers (12 → digit1 + digit2)', () => {
    const twelve = SMUFL.timeSigNumber(12);
    expect(twelve.length).toBe(2);
    expect(twelve.codePointAt(0)).toBe(0xe080 + 1);
    expect(twelve.codePointAt(1)).toBe(0xe080 + 2);
    // 16, 128 같은 임의 자릿수도 자리별 글리프 합성
    expect(SMUFL.timeSigNumber(16).length).toBe(2);
    expect(SMUFL.timeSigNumber(128).length).toBe(3);
  });

  it('timeSigNumber rejects invalid input(음수, 비정수)', () => {
    expect(() => SMUFL.timeSigNumber(-1)).toThrow();
    expect(() => SMUFL.timeSigNumber(1.5)).toThrow();
  });

  it('exports Bravura font family name', () => {
    expect(BRAVURA_FONT_FAMILY).toBe('Bravura');
  });
});
