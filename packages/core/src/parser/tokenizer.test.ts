import { describe, expect, it } from 'vitest';
import { ParseError } from './errors.js';
import { tokenizeBlock } from './tokenizer.js';

describe('tokenizeBlock', () => {
  it('parses score header', () => {
    const t = tokenizeBlock('score 4/4 key:Am bpm:100\n  A3/q C4/q');
    expect(t.header.type).toBe('score');
    expect(t.header.timeSignature).toEqual({ beats: 4, beatValue: 4 });
    expect(t.header.params).toEqual({ key: 'Am', bpm: '100' });
    expect(t.contentLines).toEqual(['  A3/q C4/q']);
  });

  it('parses fretboard header with positional', () => {
    const t = tokenizeBlock('fretboard A minor pentatonic position:5 frets:3-9');
    expect(t.header.type).toBe('fretboard');
    expect(t.header.positional).toEqual(['A', 'minor', 'pentatonic']);
    expect(t.header.params).toEqual({ position: '5', frets: '3-9' });
  });

  it('throws on unknown type', () => {
    expect(() => tokenizeBlock('hiphop 4/4')).toThrow(ParseError);
  });

  it('throws on empty block', () => {
    expect(() => tokenizeBlock('')).toThrow(ParseError);
  });
});
