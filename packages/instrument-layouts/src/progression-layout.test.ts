import { describe, expect, it } from 'vitest';
import { parseBlock, type ProgressionNode } from '@oon/core';
import { calculateProgressionLayout } from './progression-layout.js';

function parseProgression(dsl: string): ProgressionNode {
  const n = parseBlock(dsl);
  if (n.type !== 'progression') throw new Error('expected progression');
  return n;
}

describe('calculateProgressionLayout', () => {
  it('lays out cards in a single row', () => {
    const node = parseProgression('progression 4/4 in:C\n  I | V | vi | IV |');
    const layout = calculateProgressionLayout(node, { width: 400 });
    expect(layout.cards.length).toBe(4);
    const ys = layout.cards.map((c) => c.rect.y);
    expect(new Set(ys).size).toBe(1);
    expect(ys[0]).toBe(0);
  });

  it('card widths fit within input width when there is room', () => {
    const node = parseProgression('progression 4/4 in:C\n  I | V | vi | IV |');
    const layout = calculateProgressionLayout(node, {
      width: 400,
      gap: 8,
      minCardWidth: 50,
    });
    const totalCards = layout.cards.reduce((s, c) => s + c.rect.width, 0);
    const totalGaps = 3 * 8;
    expect(totalCards + totalGaps).toBeCloseTo(400, 2);
    expect(layout.width).toBeCloseTo(400, 2);
  });

  it('clamps card width to minCardWidth — layout width can exceed input width', () => {
    const node = parseProgression(
      'progression 4/4 in:C\n  I | V | vi | IV | I | V | vi | IV | I | V | vi | IV |',
    );
    const layout = calculateProgressionLayout(node, {
      width: 400,
      gap: 8,
      minCardWidth: 100,
    });
    for (const card of layout.cards) {
      expect(card.rect.width).toBeGreaterThanOrEqual(100);
    }
    expect(layout.width).toBeGreaterThan(400);
  });

  it('divides chord sub-rects by beat fraction', () => {
    const node = parseProgression('progression 4/4 in:C\n  I,V |');
    const layout = calculateProgressionLayout(node, { width: 200 });
    const card = layout.cards[0];
    expect(card?.chords.length).toBe(2);
    const c0 = card?.chords[0];
    const c1 = card?.chords[1];
    expect(c0?.rect.width).toBeCloseTo(c1?.rect.width ?? -1, 2);
  });

  it('exposes roman analysis when present', () => {
    const node = parseProgression('progression 4/4 in:C\n  I | V | vi | IV |');
    const layout = calculateProgressionLayout(node, { width: 400 });
    const romans = layout.cards.map((c) => c.chords[0]?.roman);
    expect(romans).toContain('I');
  });

  it('height equals cardHeight (single row)', () => {
    const node = parseProgression('progression 4/4 in:C\n  I | V | vi | IV |');
    const layout = calculateProgressionLayout(node, {
      width: 400,
      cardHeight: 100,
      gap: 8,
    });
    expect(layout.height).toBe(100);
  });
});
