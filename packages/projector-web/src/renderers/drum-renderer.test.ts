import { describe, expect, it } from 'vitest';
import { calculateDrumLayout, parseBlock } from '@oon/core';
import type { DrumNode } from '@oon/core';
import { renderDrum } from './drum-renderer.js';
import { FakeProjector } from '../testing/fake-projector.js';

function parseDrum(dsl: string): DrumNode {
  const n = parseBlock(dsl);
  if (n.type !== 'drum') throw new Error('expected drum');
  return n;
}

const DSL = `drum 4/4
  HH | x-x-x-x-x-x-x-x- |
  KK | x-------x------- |`;

describe('renderDrum', () => {
  it('draws one rect per cell', () => {
    const node = parseDrum(DSL);
    const layout = calculateDrumLayout(node, { width: 400 });
    const projector = new FakeProjector();
    renderDrum(projector, layout);
    expect(projector.countOps('drawRect')).toBe(layout.cells.length);
  });

  it('registers a hit area for every cell', () => {
    const node = parseDrum(DSL);
    const layout = calculateDrumLayout(node, { width: 400 });
    const projector = new FakeProjector();
    renderDrum(projector, layout);
    const drumHits = projector.hitAreas.filter((h) => h.id.startsWith('drum:'));
    expect(drumHits.length).toBe(layout.cells.length);
  });

  it('draws track labels for each track', () => {
    const node = parseDrum(DSL);
    const layout = calculateDrumLayout(node, { width: 400 });
    const projector = new FakeProjector();
    renderDrum(projector, layout);
    const texts = projector.texts();
    for (const track of layout.tracks) {
      expect(texts).toContain(track.label);
    }
  });
});
