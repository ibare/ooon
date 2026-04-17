import { describe, expect, it } from 'vitest';
import { parseBlock } from '../parser/parser.js';
import type { ScoreNode } from '../ast/types.js';
import { calculateScoreLayout } from './score-layout.js';

function parseScore(dsl: string): ScoreNode {
  const n = parseBlock(dsl);
  if (n.type !== 'score') throw new Error('expected score');
  return n;
}

describe('calculateScoreLayout', () => {
  it('returns staff, clef, time sig and bars', () => {
    const node = parseScore('score 4/4\n  A4/q B4/q C5/q D5/q |');
    const layout = calculateScoreLayout(node, { width: 400 });
    expect(layout.width).toBe(400);
    expect(layout.staff.lines.length).toBe(5);
    expect(layout.clef.glyph).toBeTruthy();
    expect(layout.timeSig.topGlyph).toBeTruthy();
    expect(layout.bars.length).toBe(1);
    expect(layout.bars[0]?.notes.length).toBe(4);
  });

  it('splits bar width evenly across bars', () => {
    const node = parseScore('score 4/4\n  A4/w | A4/w |');
    const layout = calculateScoreLayout(node, { width: 400 });
    expect(layout.bars.length).toBe(2);
    const b0 = layout.bars[0];
    const b1 = layout.bars[1];
    expect(b0).toBeDefined();
    expect(b1).toBeDefined();
    if (!b0 || !b1) return;
    expect(b1.x).toBeCloseTo(b0.x + b0.width, 2);
    expect(b0.width).toBeCloseTo(b1.width, 2);
  });

  it('places B4 on middle staff line (y = centerY)', () => {
    const node = parseScore('score 4/4\n  B4/w |');
    const layout = calculateScoreLayout(node, { width: 400, staffY: 40, lineGap: 10 });
    const note = layout.bars[0]?.notes[0];
    expect(note?.y).toBeCloseTo(layout.staff.y, 2);
  });

  it('places notes above/below staff with ledger lines', () => {
    const node = parseScore('score 4/4\n  C4/w |');
    const layout = calculateScoreLayout(node, { width: 400, staffY: 40, lineGap: 10 });
    const note = layout.bars[0]?.notes[0];
    expect(note?.y).toBeGreaterThan(layout.staff.bottom);
    expect(note?.ledgerLines.length).toBeGreaterThanOrEqual(1);
  });

  it('rests have isRest true and no pitch', () => {
    const node = parseScore('score 4/4\n  r/q A4/q r/h |');
    const layout = calculateScoreLayout(node, { width: 400 });
    const n0 = layout.bars[0]?.notes[0];
    const n2 = layout.bars[0]?.notes[2];
    expect(n0?.isRest).toBe(true);
    expect(n0?.pitch).toBe('');
    expect(n2?.isRest).toBe(true);
  });

  it('stems point down for notes above B4, up for notes below', () => {
    const node = parseScore('score 4/4\n  E4/q A4/q C5/q F5/q |');
    const layout = calculateScoreLayout(node, { width: 400 });
    const notes = layout.bars[0]?.notes ?? [];
    expect(notes[0]?.stem).toBeDefined();
    expect(notes[3]?.stem).toBeDefined();
    const e4 = notes[0];
    const f5 = notes[3];
    if (e4?.stem && f5?.stem) {
      expect(e4.stem.y2).toBeLessThan(e4.stem.y1);
      expect(f5.stem.y2).toBeGreaterThan(f5.stem.y1);
    }
  });

  it('whole notes have no stem', () => {
    const node = parseScore('score 4/4\n  A4/w |');
    const layout = calculateScoreLayout(node, { width: 400 });
    expect(layout.bars[0]?.notes[0]?.stem).toBeUndefined();
  });

  it('eighth notes have a flag glyph', () => {
    const node = parseScore('score 4/4\n  A4/e A4/e A4/e A4/e A4/e A4/e A4/e A4/e |');
    const layout = calculateScoreLayout(node, { width: 400 });
    const n0 = layout.bars[0]?.notes[0];
    expect(n0?.flag).toBeDefined();
  });

  it('accidentals produce an accidental glyph', () => {
    const node = parseScore('score 4/4\n  A#4/q Bb4/q A4/q A4/q |');
    const layout = calculateScoreLayout(node, { width: 400 });
    const notes = layout.bars[0]?.notes ?? [];
    expect(notes[0]?.accidental).toBeDefined();
    expect(notes[1]?.accidental).toBeDefined();
    expect(notes[2]?.accidental).toBeUndefined();
  });
});
