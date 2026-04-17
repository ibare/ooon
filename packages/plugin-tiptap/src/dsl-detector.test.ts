import { describe, expect, it } from 'vitest';
import {
  INLINE_OON_PREFIX,
  findInlineOonMatches,
  isOonCodeLanguage,
  looksLikeOonBlock,
} from './dsl-detector.js';

describe('INLINE_OON_PREFIX', () => {
  it('is the string "oon:"', () => {
    expect(INLINE_OON_PREFIX).toBe('oon:');
  });
});

describe('findInlineOonMatches', () => {
  it('returns empty array when no match', () => {
    expect(findInlineOonMatches('plain text without tokens')).toEqual([]);
  });

  it('detects a single inline match', () => {
    const matches = findInlineOonMatches('see `oon:C4`.');
    expect(matches).toHaveLength(1);
    const m = matches[0]!;
    expect(m.source).toBe('oon:C4');
    expect('see `oon:C4`.'.slice(m.start, m.end)).toBe('`oon:C4`');
  });

  it('detects multiple inline matches with correct offsets', () => {
    const text = '`oon:C4` then `oon:Cmaj7`';
    const matches = findInlineOonMatches(text);
    expect(matches.map((m) => m.source)).toEqual(['oon:C4', 'oon:Cmaj7']);
    expect(text.slice(matches[0]!.start, matches[0]!.end)).toBe('`oon:C4`');
    expect(text.slice(matches[1]!.start, matches[1]!.end)).toBe('`oon:Cmaj7`');
  });

  it('ignores backtick code that does not start with oon:', () => {
    expect(findInlineOonMatches('`console.log` and `oon:C4`')).toHaveLength(1);
  });

  it('is idempotent across calls (regex lastIndex reset)', () => {
    const text = '`oon:C4`';
    expect(findInlineOonMatches(text)).toHaveLength(1);
    expect(findInlineOonMatches(text)).toHaveLength(1);
  });
});

describe('isOonCodeLanguage', () => {
  it('returns true only for "oon"', () => {
    expect(isOonCodeLanguage('oon')).toBe(true);
    expect(isOonCodeLanguage('ts')).toBe(false);
    expect(isOonCodeLanguage(null)).toBe(false);
    expect(isOonCodeLanguage(undefined)).toBe(false);
    expect(isOonCodeLanguage('')).toBe(false);
  });
});

describe('looksLikeOonBlock', () => {
  it.each([
    ['score 4/4\n  C4 D4 |', true],
    ['drum 4/4\n  HH | x-x-x-x- |', true],
    ['progression 4/4 in:C\n  I | V |', true],
    ['fretboard\n  Cmaj', true],
    ['song\n  [chorus]', true],
    ['  score 4/4\n  C4', true],
    ['plain prose', false],
    ['note C4', false],
  ])('source %p -> %p', (src, expected) => {
    expect(looksLikeOonBlock(src)).toBe(expected);
  });
});
