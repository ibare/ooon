import { describe, expect, it } from 'vitest';
import { resolveRoman, RomanParseError } from './roman.js';

describe('resolveRoman in major key (C)', () => {
  it('I = C major', () => {
    const r = resolveRoman('I', 'C', 'major');
    expect(r.symbol).toBe('C');
    expect(r.notes).toEqual(['C', 'E', 'G']);
  });

  it('ii = Dm', () => {
    const r = resolveRoman('ii', 'C', 'major');
    expect(r.symbol).toBe('Dm');
  });

  it('V = G', () => {
    expect(resolveRoman('V', 'C', 'major').symbol).toBe('G');
  });

  it('vi = Am', () => {
    expect(resolveRoman('vi', 'C', 'major').symbol).toBe('Am');
  });

  it('V7 = G7', () => {
    const r = resolveRoman('V7', 'C', 'major');
    expect(r.symbol).toBe('G7');
    expect(r.notes).toEqual(['G', 'B', 'D', 'F']);
  });
});

describe('resolveRoman in minor key (Am)', () => {
  it('i = Am', () => {
    expect(resolveRoman('i', 'A', 'minor').symbol).toBe('Am');
  });

  it('III = C', () => {
    expect(resolveRoman('III', 'A', 'minor').symbol).toBe('C');
  });

  it('iv = Dm', () => {
    expect(resolveRoman('iv', 'A', 'minor').symbol).toBe('Dm');
  });

  it('VI = F, VII = G', () => {
    expect(resolveRoman('VI', 'A', 'minor').symbol).toBe('F');
    expect(resolveRoman('VII', 'A', 'minor').symbol).toBe('G');
  });
});

describe('altered romans', () => {
  it('bVII in C major = Bb', () => {
    expect(resolveRoman('bVII', 'C', 'major').symbol).toBe('Bb');
  });

  it('ii° and vii° are diminished', () => {
    expect(resolveRoman('vii°', 'C', 'major').quality).toBe('dim');
  });
});

describe('RomanParseError', () => {
  it('throws on unknown numeral', () => {
    expect(() => resolveRoman('VIII', 'C', 'major')).toThrow(RomanParseError);
    expect(() => resolveRoman('XX', 'C', 'major')).toThrow(RomanParseError);
  });
});
