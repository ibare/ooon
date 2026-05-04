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

  it('header-only score yields a single empty bar', () => {
    const n = parseBlock('score 4/4');
    if (n.type !== 'score') throw new Error('type');
    expect(n.bars.length).toBe(1);
    expect(n.bars[0]?.barNumber).toBe(1);
    expect(n.bars[0]?.notes.length).toBe(0);
    expect(n.warnings).toEqual([]);
  });

  it('single-note tokens populate pitches with one entry', () => {
    const n = parseBlock('score 4/4\n  A4/w |');
    if (n.type !== 'score') throw new Error('type');
    expect(n.bars[0]?.notes[0]?.pitches).toEqual(['A4']);
    expect(n.bars[0]?.notes[0]?.isRest).toBe(false);
  });

  it('rests have empty pitches array', () => {
    const n = parseBlock('score 4/4\n  r/w |');
    if (n.type !== 'score') throw new Error('type');
    expect(n.bars[0]?.notes[0]?.pitches).toEqual([]);
    expect(n.bars[0]?.notes[0]?.isRest).toBe(true);
  });

  it('parses chord token [C4 E4 G4]/q', () => {
    const n = parseBlock('score 4/4\n  [C4 E4 G4]/q A4/q B4/q C5/q |');
    if (n.type !== 'score') throw new Error('type');
    const chord = n.bars[0]?.notes[0];
    expect(chord?.pitches).toEqual(['C4', 'E4', 'G4']);
    expect(chord?.isRest).toBe(false);
    expect(chord?.beats).toBe(1);
    expect(n.warnings).toEqual([]);
  });

  it('chord tokens preserve user input order', () => {
    const n = parseBlock('score 4/4\n  [G4 C4 E4]/w |');
    if (n.type !== 'score') throw new Error('type');
    expect(n.bars[0]?.notes[0]?.pitches).toEqual(['G4', 'C4', 'E4']);
  });

  it('chord ignores whitespace inside brackets', () => {
    const n = parseBlock('score 4/4\n  [  C4   E4  G4 ]/h r/h |');
    if (n.type !== 'score') throw new Error('type');
    expect(n.bars[0]?.notes[0]?.pitches).toEqual(['C4', 'E4', 'G4']);
  });

  it('rejects rest inside chord', () => {
    expect(() => parseBlock('score 4/4\n  [C4 r G4]/q |')).toThrow(/Rest 'r' not allowed/);
  });

  it('rejects single-pitch chord', () => {
    expect(() => parseBlock('score 4/4\n  [C4]/q |')).toThrow(/at least 2 pitches/);
  });

  it('rejects unclosed chord bracket', () => {
    expect(() => parseBlock('score 4/4\n  [C4 E4 G4/q |')).toThrow(/Unclosed chord/);
  });

  it('mixes chord and single-note tokens within a bar', () => {
    const n = parseBlock('score 4/4\n  C4/q [E4 G4]/q r/q [A4 C5 E5]/q |');
    if (n.type !== 'score') throw new Error('type');
    const notes = n.bars[0]?.notes ?? [];
    expect(notes.map((x) => x.pitches)).toEqual([['C4'], ['E4', 'G4'], [], ['A4', 'C5', 'E5']]);
  });
});
