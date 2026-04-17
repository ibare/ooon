import { describe, expect, it } from 'vitest';
import { ParseError } from './errors.js';
import { parseBlock } from './parser.js';

describe('parseProgressionBlock', () => {
  it('parses Am progression i-VI-III-VII', () => {
    const dsl = `progression 4/4 in:Am bpm:90
  i | VI | III | VII |`;
    const n = parseBlock(dsl);
    expect(n.type).toBe('progression');
    if (n.type !== 'progression') return;
    expect(n.key).toBe('A');
    expect(n.mode).toBe('minor');
    expect(n.bars.length).toBe(4);
    expect(n.bars[0]?.chords[0]?.symbol).toBe('Am');
    expect(n.bars[1]?.chords[0]?.symbol).toBe('F');
    expect(n.bars[2]?.chords[0]?.symbol).toBe('C');
    expect(n.bars[3]?.chords[0]?.symbol).toBe('G');
  });

  it('splits comma-separated chords in bar', () => {
    const dsl = `progression 4/4 in:C
  I | IV,V | I |`;
    const n = parseBlock(dsl);
    if (n.type !== 'progression') throw new Error('type');
    expect(n.bars[1]?.chords.length).toBe(2);
    expect(n.bars[1]?.chords[0]?.beats).toBe(2);
    expect(n.bars[1]?.chords[1]?.beats).toBe(2);
  });

  it('throws on missing in: parameter', () => {
    expect(() => parseBlock('progression 4/4\n  I | V |')).toThrow(ParseError);
  });
});
