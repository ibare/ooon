import { describe, expect, it } from 'vitest';
import { parseBlock } from '@oon/core';
import type { SongNode } from '@oon/core';
import { calculateSongLayout } from '@oon/composition';
import { renderSong } from './song-renderer.js';
import { FakeProjector } from '../testing/fake-projector.js';

function parseSong(dsl: string): SongNode {
  const n = parseBlock(dsl);
  if (n.type !== 'song') throw new Error('expected song');
  return n;
}

const DSL = `song 4/4 key:C bpm:100
  beat: 8beat-rock
  C | G |
  C4/q D4/q E4/q F4/q | G4/q A4/q B4/q C5/q |`;

describe('renderSong', () => {
  it('renders keyboard + progression + score + drum', () => {
    const node = parseSong(DSL);
    const layout = calculateSongLayout(node, { width: 600 });
    const projector = new FakeProjector();
    renderSong(projector, layout);
    const texts = projector.texts();
    expect(texts).toContain('C');
    expect(texts).toContain(layout.systems[0]!.score.layout.systems[0]!.clef.glyph);
    const drumHits = projector.hitAreas.filter((h) => h.id.startsWith('drum:'));
    expect(drumHits.length).toBeGreaterThan(0);
    const keyHits = projector.hitAreas.filter((h) => h.id.startsWith('key:'));
    expect(keyHits.length).toBeGreaterThan(0);
  });

  it('omits drum row when no beat specified', () => {
    const node = parseSong(`song 4/4 key:C bpm:100
  C | G |
  C4/q D4/q E4/q F4/q | G4/q A4/q B4/q C5/q |`);
    const layout = calculateSongLayout(node, { width: 600 });
    const projector = new FakeProjector();
    renderSong(projector, layout);
    const drumHits = projector.hitAreas.filter((h) => h.id.startsWith('drum:'));
    expect(drumHits.length).toBe(0);
  });
});
