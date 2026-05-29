import { describe, expect, it } from 'vitest';
import { parseBlock } from '@ooon/core';
import type { ProgressionNode } from '@ooon/core';
import { calculateProgressionLayout } from '@ooon/instrument-layouts';
import { renderProgression } from './progression-renderer.js';
import { FakeProjector } from '../testing/fake-projector.js';

function parseProgression(dsl: string): ProgressionNode {
  const n = parseBlock(dsl);
  if (n.type !== 'progression') throw new Error('expected progression');
  return n;
}

describe('renderProgression', () => {
  it('draws one card per bar', () => {
    const node = parseProgression('progression 4/4 in:C\n  I | V | vi | IV |');
    const layout = calculateProgressionLayout(node, { width: 400 });
    const projector = new FakeProjector();
    renderProgression(projector, layout);
    const cardRects = projector.callsOf('drawRect').filter((c) => {
      const radius = c.args[4];
      return typeof radius === 'number' && radius > 0;
    });
    expect(cardRects.length).toBe(4);
  });

  it('draws chord symbols', () => {
    const node = parseProgression('progression 4/4 in:C\n  I | V | vi | IV |');
    const layout = calculateProgressionLayout(node, { width: 400 });
    const projector = new FakeProjector();
    renderProgression(projector, layout);
    const texts = projector.texts();
    expect(texts).toContain('C');
    expect(texts).toContain('G');
    expect(texts).toContain('Am');
    expect(texts).toContain('F');
  });

  it('hides romans when showRomans is false', () => {
    const node = parseProgression('progression 4/4 in:C\n  I | V |');
    const layout = calculateProgressionLayout(node, { width: 400 });
    const a = new FakeProjector();
    const b = new FakeProjector();
    renderProgression(a, layout, { showRomans: true });
    renderProgression(b, layout, { showRomans: false });
    expect(a.texts()).toContain('I');
    expect(b.texts()).not.toContain('I');
  });
});
