import { describe, expect, it } from 'vitest';
import { parseBlock } from './parser.js';

describe('parseSongBlock', () => {
  it('parses 4-bar song with beat, chord line, melody line', () => {
    const dsl = `song bpm:100 key:Am 4/4
  beat: 8beat-rock
  Am              | F               | C               | G               |
  A3/q C4/q D4/q E4/q | G4/q A4/q G4/q E4/q | D4/q C4/q A3/q C4/q | D4/h E4/h           |`;
    const n = parseBlock(dsl);
    expect(n.type).toBe('song');
    if (n.type !== 'song') return;
    expect(n.beat).toBe('8beat-rock');
    expect(n.barCount).toBe(4);
    expect(n.bars[0]?.chord.symbol).toBe('Am');
    expect(n.bars[1]?.chord.symbol).toBe('F');
    expect(n.bars[0]?.melody.length).toBe(4);
    expect(n.bars[0]?.drum?.HH?.length).toBe(16);
  });

  it('works without beat line', () => {
    const dsl = `song 4/4 key:C
  C | G | Am | F |
  C4/w | D4/w | E4/w | F4/w |`;
    const n = parseBlock(dsl);
    if (n.type !== 'song') throw new Error('type');
    expect(n.beat).toBeUndefined();
    expect(n.bars[0]?.drum).toBeUndefined();
  });

  it('warns on bar count mismatch', () => {
    const dsl = `song 4/4 key:C
  C | G |
  C4/w | D4/w | E4/w |`;
    const n = parseBlock(dsl);
    if (n.type !== 'song') throw new Error('type');
    expect(n.warnings.some((w) => w.includes('mismatch'))).toBe(true);
  });
});
