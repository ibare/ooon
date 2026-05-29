import { describe, expect, it } from 'vitest';
import { parseInline } from '@ooon/core';
import { renderChord } from './chord-renderer.js';
import { FakeProjector } from '../testing/fake-projector.js';

function parseChord(src: string) {
  const n = parseInline(src);
  if (n.type !== 'chord') throw new Error('expected chord');
  return n;
}

describe('renderChord', () => {
  it('draws chord symbol text', () => {
    const node = parseChord('chord:Am');
    const projector = new FakeProjector();
    renderChord(projector, node);
    const texts = projector.texts();
    expect(texts).toContain('Am');
  });

  it('highlights notes of the chord', () => {
    const node = parseChord('chord:C');
    const projector = new FakeProjector();
    renderChord(projector, node);
    expect(projector.hitAreas.length).toBeGreaterThan(0);
  });
});
