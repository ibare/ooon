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

  it('timeSigDigit returns single codepoint at 0xE080 + d', () => {
    for (let d = 0; d <= 9; d++) {
      expect(SMUFL.timeSigDigit(d).codePointAt(0)).toBe(0xe080 + d);
    }
  });

  it('timeSigDigit rejects invalid digits', () => {
    expect(() => SMUFL.timeSigDigit(-1)).toThrow();
    expect(() => SMUFL.timeSigDigit(10)).toThrow();
    expect(() => SMUFL.timeSigDigit(1.5)).toThrow();
  });

  it('exports Bravura font family name', () => {
    expect(BRAVURA_FONT_FAMILY).toBe('Bravura');
  });
});
