import { describe, expect, it } from 'vitest';
import {
  INLINE_OOON_PREFIX,
  findInlineOoonMatches,
  isOoonCodeLanguage,
  looksLikeOoonBlock,
} from './dsl-detector.js';

describe('INLINE_OOON_PREFIX', () => {
  it('is the string "ooon:"', () => {
    expect(INLINE_OOON_PREFIX).toBe('ooon:');
  });
});

describe('findInlineOoonMatches', () => {
  it('returns empty array when no match', () => {
    expect(findInlineOoonMatches('plain text without tokens')).toEqual([]);
  });

  it('detects a single inline match', () => {
    const matches = findInlineOoonMatches('see `ooon:C4`.');
    expect(matches).toHaveLength(1);
    const m = matches[0]!;
    expect(m.source).toBe('ooon:C4');
    expect('see `ooon:C4`.'.slice(m.start, m.end)).toBe('`ooon:C4`');
  });

  it('detects multiple inline matches with correct offsets', () => {
    const text = '`ooon:C4` then `ooon:Cmaj7`';
    const matches = findInlineOoonMatches(text);
    expect(matches.map((m) => m.source)).toEqual(['ooon:C4', 'ooon:Cmaj7']);
    expect(text.slice(matches[0]!.start, matches[0]!.end)).toBe('`ooon:C4`');
    expect(text.slice(matches[1]!.start, matches[1]!.end)).toBe('`ooon:Cmaj7`');
  });

  it('ignores backtick code that does not start with ooon:', () => {
    expect(findInlineOoonMatches('`console.log` and `ooon:C4`')).toHaveLength(1);
  });

  it('is idempotent across calls (regex lastIndex reset)', () => {
    const text = '`ooon:C4`';
    expect(findInlineOoonMatches(text)).toHaveLength(1);
    expect(findInlineOoonMatches(text)).toHaveLength(1);
  });
});

describe('isOoonCodeLanguage', () => {
  it('returns true only for "ooon"', () => {
    expect(isOoonCodeLanguage('ooon')).toBe(true);
    expect(isOoonCodeLanguage('ts')).toBe(false);
    expect(isOoonCodeLanguage(null)).toBe(false);
    expect(isOoonCodeLanguage(undefined)).toBe(false);
    expect(isOoonCodeLanguage('')).toBe(false);
  });
});

describe('looksLikeOoonBlock', () => {
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
    expect(looksLikeOoonBlock(src)).toBe(expected);
  });
});
