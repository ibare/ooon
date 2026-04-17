import { describe, expect, it } from 'vitest';
import { parseBlock } from './parser.js';

describe('parseScoreBlock', () => {
  it('parses simple 2-bar score', () => {
    const dsl = `score 4/4 key:Am bpm:100
  A3/q C4/q D4/q E4/q | G4/q A4/q G4/q E4/q |`;
    const n = parseBlock(dsl);
    expect(n.type).toBe('score');
    if (n.type !== 'score') return;
    expect(n.bpm).toBe(100);
    expect(n.key).toBe('Am');
    expect(n.bars.length).toBe(2);
    expect(n.bars[0]?.notes.length).toBe(4);
    expect(n.warnings).toEqual([]);
  });

  it('parses rests', () => {
    const n = parseBlock('score 4/4\n  r/q A4/q r/h |');
    if (n.type !== 'score') throw new Error('type');
    expect(n.bars[0]?.notes[0]?.isRest).toBe(true);
    expect(n.bars[0]?.notes[2]?.isRest).toBe(true);
  });

  it('parses dotted durations', () => {
    const n = parseBlock('score 4/4\n  A4/q. A4/e A4/h |');
    if (n.type !== 'score') throw new Error('type');
    expect(n.bars[0]?.notes[0]?.beats).toBe(1.5);
    expect(n.bars[0]?.notes[1]?.beats).toBe(0.5);
  });

  it('pads under-length bar with rest', () => {
    const n = parseBlock('score 4/4\n  A4/q |');
    if (n.type !== 'score') throw new Error('type');
    expect(n.bars[0]?.notes.length).toBe(2);
    expect(n.bars[0]?.notes[1]?.isRest).toBe(true);
    expect(n.warnings.length).toBe(1);
  });

  it('warns on overflow', () => {
    const n = parseBlock('score 4/4\n  A4/w A4/w |');
    if (n.type !== 'score') throw new Error('type');
    expect(n.warnings.length).toBe(1);
  });

  it('defaults bpm to 100', () => {
    const n = parseBlock('score 4/4\n  A4/w |');
    if (n.type !== 'score') throw new Error('type');
    expect(n.bpm).toBe(100);
  });
});
