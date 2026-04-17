import { describe, expect, it } from 'vitest';
import { ParseError } from './errors.js';
import { parseInline } from './inline-parser.js';

describe('parseInline', () => {
  it('parses chord token', () => {
    const n = parseInline('chord:Am');
    expect(n.type).toBe('chord');
    if (n.type === 'chord') {
      expect(n.symbol).toBe('Am');
      expect(n.notes).toEqual(['A', 'C', 'E']);
    }
  });

  it('parses scale token', () => {
    const n = parseInline('scale:C major');
    expect(n.type).toBe('scale');
    if (n.type === 'scale') {
      expect(n.root).toBe('C');
      expect(n.scaleType).toBe('major');
      expect(n.notes.length).toBe(7);
    }
  });

  it('parses note token with frequency', () => {
    const n = parseInline('note:A4');
    expect(n.type).toBe('note');
    if (n.type === 'note') {
      expect(n.midiNumber).toBe(69);
      expect(n.frequency).toBeCloseTo(440, 3);
    }
  });

  it('throws on missing colon', () => {
    expect(() => parseInline('chord')).toThrow(ParseError);
  });

  it('throws on unknown inline type', () => {
    expect(() => parseInline('rhythm:Am')).toThrow(ParseError);
  });

  it('throws on empty value', () => {
    expect(() => parseInline('chord:')).toThrow(ParseError);
  });
});
