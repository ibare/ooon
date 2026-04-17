import { describe, expect, it } from 'vitest';
import { parseBlock } from './parser.js';

describe('parseFretboardBlock', () => {
  it('parses A minor pentatonic at position 5', () => {
    const dsl = 'fretboard A minor pentatonic position:5 frets:3-9';
    const n = parseBlock(dsl);
    expect(n.type).toBe('fretboard');
    if (n.type !== 'fretboard') return;
    expect(n.scale.root).toBe('A');
    expect(n.scale.scaleType).toBe('minor-pentatonic');
    expect(n.position).toBe(5);
    expect(n.fretRange).toEqual([3, 9]);
    expect(n.tuning.length).toBe(6);
    expect(n.dots.length).toBeGreaterThan(0);
    expect(n.dots.some((d) => d.isRoot)).toBe(true);
  });

  it('defaults frets to 0-12', () => {
    const n = parseBlock('fretboard C major');
    if (n.type !== 'fretboard') throw new Error('type');
    expect(n.fretRange).toEqual([0, 12]);
  });

  it('only includes notes in scale', () => {
    const n = parseBlock('fretboard A minor-pentatonic frets:0-12');
    if (n.type !== 'fretboard') throw new Error('type');
    const pentatonicPcs = new Set([9, 0, 2, 4, 7]);
    for (const dot of n.dots) {
      const pc = ((dot.midiNote % 12) + 12) % 12;
      expect(pentatonicPcs.has(pc)).toBe(true);
    }
  });
});
