import { describe, expect, it } from 'vitest';
import { parseBlock } from '@ooon/core';
import type { FretboardNode } from '@ooon/core';
import { calculateFretboardLayout } from '@ooon/instrument-layouts';
import { renderFretboard } from './fretboard-renderer.js';
import { FakeProjector } from '../testing/fake-projector.js';

function parseFretboard(dsl: string): FretboardNode {
  const n = parseBlock(dsl);
  if (n.type !== 'fretboard') throw new Error('expected fretboard');
  return n;
}

describe('renderFretboard', () => {
  it('draws string + fret lines', () => {
    const node = parseFretboard('fretboard A minor-pentatonic frets:0-12');
    const layout = calculateFretboardLayout(node, { width: 600 });
    const projector = new FakeProjector();
    renderFretboard(projector, layout);
    const expectedLines = layout.strings.length + layout.frets.length;
    expect(projector.countOps('drawLine')).toBe(expectedLines);
  });

  it('draws a circle per dot', () => {
    const node = parseFretboard('fretboard A minor-pentatonic frets:0-12');
    const layout = calculateFretboardLayout(node, { width: 600 });
    const projector = new FakeProjector();
    renderFretboard(projector, layout);
    expect(projector.countOps('drawCircle')).toBe(layout.dots.length);
  });

  it('registers hit areas for each dot', () => {
    const node = parseFretboard('fretboard A minor-pentatonic frets:0-12');
    const layout = calculateFretboardLayout(node, { width: 600 });
    const projector = new FakeProjector();
    renderFretboard(projector, layout);
    const fretHits = projector.hitAreas.filter((h) => h.id.startsWith('fret:'));
    expect(fretHits.length).toBe(layout.dots.length);
  });
});
