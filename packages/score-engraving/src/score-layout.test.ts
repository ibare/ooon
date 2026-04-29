import { describe, expect, it } from 'vitest';
import { parseBlock, type ScoreNode } from '@oon/core';
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
    expect(layout.systems[0]!.staff.lines.length).toBe(5);
    expect(layout.systems[0]!.clef.glyph).toBeTruthy();
    expect(layout.systems[0]!.timeSig.topGlyph).toBeTruthy();
    expect(layout.systems[0]!.bars.length).toBe(1);
    expect(layout.systems[0]!.bars[0]?.notes.length).toBe(4);
  });

  it('splits bar width evenly across bars', () => {
    const node = parseScore('score 4/4\n  A4/w | A4/w |');
    const layout = calculateScoreLayout(node, { width: 400 });
    expect(layout.systems[0]!.bars.length).toBe(2);
    const b0 = layout.systems[0]!.bars[0];
    const b1 = layout.systems[0]!.bars[1];
    expect(b0).toBeDefined();
    expect(b1).toBeDefined();
    if (!b0 || !b1) return;
    expect(b1.x).toBeCloseTo(b0.x + b0.width, 2);
    expect(b0.width).toBeCloseTo(b1.width, 2);
  });

  it('places B4 on middle staff line (y = centerY)', () => {
    const node = parseScore('score 4/4\n  B4/w |');
    const layout = calculateScoreLayout(node, { width: 400, staffY: 40, lineGap: 10 });
    const note = layout.systems[0]!.bars[0]?.notes[0];
    expect(note?.y).toBeCloseTo(layout.systems[0]!.staff.y, 2);
  });

  it('places notes above/below staff with ledger lines', () => {
    const node = parseScore('score 4/4\n  C4/w |');
    const layout = calculateScoreLayout(node, { width: 400, staffY: 40, lineGap: 10 });
    const note = layout.systems[0]!.bars[0]?.notes[0];
    expect(note?.y).toBeGreaterThan(layout.systems[0]!.staff.bottom);
    expect(note?.ledgerLines.length).toBeGreaterThanOrEqual(1);
  });

  it('rests have isRest true and no pitch', () => {
    const node = parseScore('score 4/4\n  r/q A4/q r/h |');
    const layout = calculateScoreLayout(node, { width: 400 });
    const n0 = layout.systems[0]!.bars[0]?.notes[0];
    const n2 = layout.systems[0]!.bars[0]?.notes[2];
    expect(n0?.isRest).toBe(true);
    expect(n0?.pitch).toBe('');
    expect(n2?.isRest).toBe(true);
  });

  it('stems point down for notes above B4, up for notes below', () => {
    const node = parseScore('score 4/4\n  E4/q A4/q C5/q F5/q |');
    const layout = calculateScoreLayout(node, { width: 400 });
    const notes = layout.systems[0]!.bars[0]?.notes ?? [];
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
    expect(layout.systems[0]!.bars[0]?.notes[0]?.stem).toBeUndefined();
  });

  it('a standalone eighth note has a flag glyph (not beamed)', () => {
    // 단독 8분음표(앞뒤가 q/h 등 빔 불가 음가)는 flag을 가진다.
    const node = parseScore('score 4/4\n  A4/e A4/q A4/q A4/q A4/e |');
    const layout = calculateScoreLayout(node, { width: 400 });
    const n0 = layout.systems[0]!.bars[0]?.notes[0];
    expect(n0?.flag).toBeDefined();
  });

  it('accidentals produce glyphs and apply carry-over within a bar', () => {
    // C major. A#4 다음 A4는 ♮ 글리프, 그 다음 A4는 carry되어 글리프 없음.
    const node = parseScore('score 4/4\n  A#4/q Bb4/q A4/q A4/q |');
    const layout = calculateScoreLayout(node, { width: 400 });
    const notes = layout.systems[0]!.bars[0]?.notes ?? [];
    expect(notes[0]?.accidental).toBeDefined();
    expect(notes[1]?.accidental).toBeDefined();
    expect(notes[2]?.accidental).toBeDefined(); // natural
    expect(notes[3]?.accidental).toBeUndefined();
  });

  it('caps bars per system at maxBarsPerSystem even when width is plenty', () => {
    // 폭이 충분해 8마디가 한 줄에 들어갈 수 있어도 기본 5마디 상한으로 분할한다.
    const node = parseScore(
      'score 4/4\n  A4/w | A4/w | A4/w | A4/w | A4/w | A4/w | A4/w | A4/w |',
    );
    const layout = calculateScoreLayout(node, { width: 4000 });
    expect(layout.systems.length).toBe(2);
    expect(layout.systems[0]!.bars.length).toBe(5);
    expect(layout.systems[1]!.bars.length).toBe(3);
  });

  it('respects custom maxBarsPerSystem', () => {
    const node = parseScore(
      'score 4/4\n  A4/w | A4/w | A4/w | A4/w | A4/w | A4/w |',
    );
    const layout = calculateScoreLayout(node, { width: 4000, maxBarsPerSystem: 2 });
    expect(layout.systems.length).toBe(3);
    for (const sys of layout.systems) expect(sys.bars.length).toBe(2);
  });
});
