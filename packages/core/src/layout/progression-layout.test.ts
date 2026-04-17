import { describe, expect, it } from 'vitest';
import { parseBlock } from '../parser/parser.js';
import type { ProgressionNode } from '../ast/types.js';
import { calculateProgressionLayout } from './progression-layout.js';

function parseProgression(dsl: string): ProgressionNode {
  const n = parseBlock(dsl);
  if (n.type !== 'progression') throw new Error('expected progression');
  return n;
}

describe('calculateProgressionLayout', () => {
  it('lays out cards in a grid', () => {
    const node = parseProgression('progression 4/4 in:C\n  I | V | vi | IV |');
    const layout = calculateProgressionLayout(node, { width: 400 });
    expect(layout.cards.length).toBe(4);
    expect(layout.cols).toBeGreaterThan(0);
    expect(layout.rows).toBeGreaterThan(0);
  });

  it('respects explicit columns option', () => {
    const node = parseProgression('progression 4/4 in:C\n  I | V | vi | IV |');
    const layout = calculateProgressionLayout(node, { width: 400, columns: 2 });
    expect(layout.cols).toBe(2);
    expect(layout.rows).toBe(2);
  });

  it('card width sums plus gaps equal total width', () => {
    const node = parseProgression('progression 4/4 in:C\n  I | V | vi | IV |');
    const layout = calculateProgressionLayout(node, { width: 400, columns: 4, gap: 8 });
    const firstRow = layout.cards.slice(0, 4);
    const totalCards = firstRow.reduce((s, c) => s + c.rect.width, 0);
    const totalGaps = 3 * 8;
    expect(totalCards + totalGaps).toBeCloseTo(400, 2);
  });

  it('divides chord sub-rects by beat fraction', () => {
    const node = parseProgression('progression 4/4 in:C\n  I,V |');
    const layout = calculateProgressionLayout(node, { width: 200, columns: 1 });
    const card = layout.cards[0];
    expect(card?.chords.length).toBe(2);
    const c0 = card?.chords[0];
    const c1 = card?.chords[1];
    expect(c0?.rect.width).toBeCloseTo(c1?.rect.width ?? -1, 2);
  });

  it('exposes roman analysis when present', () => {
    const node = parseProgression('progression 4/4 in:C\n  I | V | vi | IV |');
    const layout = calculateProgressionLayout(node, { width: 400, columns: 4 });
    const romans = layout.cards.map((c) => c.chords[0]?.roman);
    expect(romans).toContain('I');
  });

  it('height equals rows * cardHeight + (rows-1) * gap', () => {
    const node = parseProgression('progression 4/4 in:C\n  I | V | vi | IV |');
    const layout = calculateProgressionLayout(node, {
      width: 400,
      columns: 2,
      cardHeight: 100,
      gap: 8,
    });
    expect(layout.height).toBe(2 * 100 + 1 * 8);
  });
});
