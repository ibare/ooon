import { describe, expect, it } from 'vitest';
import { ChordParseError, parseChordSymbol } from './chords.js';

describe('parseChordSymbol', () => {
  it('parses major triad', () => {
    const c = parseChordSymbol('C');
    expect(c.root).toBe('C');
    expect(c.quality).toBe('');
    expect(c.notes).toEqual(['C', 'E', 'G']);
  });

  it('parses minor triad', () => {
    const c = parseChordSymbol('Am');
    expect(c.root).toBe('A');
    expect(c.quality).toBe('m');
    expect(c.notes).toEqual(['A', 'C', 'E']);
  });

  it('parses dominant 7th', () => {
    const c = parseChordSymbol('G7');
    expect(c.quality).toBe('7');
    expect(c.notes).toEqual(['G', 'B', 'D', 'F']);
  });

  it('parses maj7 before m7', () => {
    const c = parseChordSymbol('Cmaj7');
    expect(c.quality).toBe('maj7');
    expect(c.notes).toEqual(['C', 'E', 'G', 'B']);
  });

  it('parses m7', () => {
    const c = parseChordSymbol('Dm7');
    expect(c.quality).toBe('m7');
    expect(c.notes).toEqual(['D', 'F', 'A', 'C']);
  });

  it('parses m7b5', () => {
    const c = parseChordSymbol('Bm7b5');
    expect(c.quality).toBe('m7b5');
    expect(c.notes).toEqual(['B', 'D', 'F', 'A']);
  });

  it('parses dim and dim7', () => {
    expect(parseChordSymbol('Cdim').notes).toEqual(['C', 'D#', 'F#']);
    expect(parseChordSymbol('Cdim7').notes).toEqual(['C', 'D#', 'F#', 'A']);
  });

  it('parses aug', () => {
    expect(parseChordSymbol('Caug').notes).toEqual(['C', 'E', 'G#']);
  });

  it('parses sus2 and sus4', () => {
    expect(parseChordSymbol('Csus2').notes).toEqual(['C', 'D', 'G']);
    expect(parseChordSymbol('Csus4').notes).toEqual(['C', 'F', 'G']);
  });

  it('parses 6, m6, 9, add9', () => {
    expect(parseChordSymbol('C6').notes).toEqual(['C', 'E', 'G', 'A']);
    expect(parseChordSymbol('Cm6').notes).toEqual(['C', 'D#', 'G', 'A']);
    expect(parseChordSymbol('Cadd9').notes.length).toBe(4);
    expect(parseChordSymbol('C9').notes.length).toBe(5);
  });

  it('parses sharp/flat roots with flat preference', () => {
    const sharp = parseChordSymbol('F#m');
    expect(sharp.root).toBe('F#');
    const flat = parseChordSymbol('Bbm');
    expect(flat.root).toBe('Bb');
    expect(flat.notes[0]).toBe('Bb');
  });

  it('parses slash chords', () => {
    const c = parseChordSymbol('C/E');
    expect(c.root).toBe('C');
    expect(c.bass).toBe('E');
  });

  it('throws on invalid symbol', () => {
    expect(() => parseChordSymbol('Hm')).toThrow(ChordParseError);
    expect(() => parseChordSymbol('Cxyz')).toThrow(ChordParseError);
  });
});
