import { describe, expect, it } from 'vitest';
import { buildScale, parseScaleLine, ScaleParseError } from './scales.js';

describe('buildScale', () => {
  it('builds C major', () => {
    const s = buildScale('C', 'major');
    expect(s.notes).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
  });

  it('builds A minor', () => {
    const s = buildScale('A', 'minor');
    expect(s.notes).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
  });

  it('builds A minor pentatonic (5 notes)', () => {
    const s = buildScale('A', 'minor-pentatonic');
    expect(s.notes).toEqual(['A', 'C', 'D', 'E', 'G']);
    expect(s.notes.length).toBe(5);
  });

  it('builds blues scale (6 notes)', () => {
    const s = buildScale('A', 'blues');
    expect(s.notes.length).toBe(6);
  });

  it('builds dorian, phrygian, lydian, mixolydian', () => {
    expect(buildScale('D', 'dorian').notes).toEqual(['D', 'E', 'F', 'G', 'A', 'B', 'C']);
    expect(buildScale('E', 'phrygian').notes).toEqual(['E', 'F', 'G', 'A', 'B', 'C', 'D']);
    expect(buildScale('F', 'lydian').notes).toEqual(['F', 'G', 'A', 'B', 'C', 'D', 'E']);
    expect(buildScale('G', 'mixolydian').notes).toEqual(['G', 'A', 'B', 'C', 'D', 'E', 'F']);
  });

  it('builds harmonic minor (raised 7th)', () => {
    const s = buildScale('A', 'harmonic-minor');
    expect(s.notes[6]).toBe('G#');
  });
});

describe('parseScaleLine', () => {
  it('parses "C major"', () => {
    const s = parseScaleLine('C major');
    expect(s.root).toBe('C');
    expect(s.scaleType).toBe('major');
  });

  it('parses "A minor pentatonic"', () => {
    const s = parseScaleLine('A minor pentatonic');
    expect(s.root).toBe('A');
    expect(s.scaleType).toBe('minor-pentatonic');
  });

  it('throws on unknown scale type', () => {
    expect(() => parseScaleLine('C quantum')).toThrow(ScaleParseError);
  });
});
