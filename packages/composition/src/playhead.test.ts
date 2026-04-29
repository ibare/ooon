import { describe, expect, it } from 'vitest';
import { parseBlock, type SongNode } from '@oon/core';
import { calculateSongLayout } from './song-layout.js';
import { getSongPlayhead } from './playhead.js';

function parseSong(dsl: string): SongNode {
  const n = parseBlock(dsl);
  if (n.type !== 'song') throw new Error('expected song');
  return n;
}

const SONG_WITH_DRUM = `song 4/4 key:C bpm:100
  beat: 8beat-rock
  C | G |
  C4/q D4/q E4/q F4/q | G4/q A4/q B4/q C5/q |`;

describe('getSongPlayhead', () => {
  it('returns x positions for chord and score; drum present when beat row exists', () => {
    const node = parseSong(SONG_WITH_DRUM);
    const layout = calculateSongLayout(node, { width: 600 });
    const pos = getSongPlayhead(layout, 0, 4);
    expect(pos.chord.x).toBe(layout.chordRow.cards[0]!.rect.x);
    expect(pos.score).not.toBeNull();
    expect(pos.drum).toBeDefined();
  });

  it('row y matches the row layout y', () => {
    const node = parseSong(SONG_WITH_DRUM);
    const layout = calculateSongLayout(node, { width: 600 });
    const pos = getSongPlayhead(layout, 0, 4);
    expect(pos.chord.y).toBe(layout.chordRow.y);
    if (pos.score) {
      expect(pos.score.y).toBeGreaterThanOrEqual(layout.scoreRow.y);
    }
    expect(pos.drum?.y).toBe(layout.drumRow!.y);
  });

  it('chord and drum advance to next bar at boundary', () => {
    const node = parseSong(SONG_WITH_DRUM);
    const layout = calculateSongLayout(node, { width: 600 });
    const pos = getSongPlayhead(layout, 4, 4);
    expect(pos.chord.x).toBeCloseTo(layout.chordRow.cards[1]!.rect.x, 5);
    expect(pos.drum!.x).toBeCloseTo(layout.drumRow!.drum.barDividers[1]!.x, 5);
  });

  it('omits drum field when no drum row', () => {
    const node = parseSong(`song 4/4 key:C bpm:100
  C | G |
  C4/q D4/q E4/q F4/q | G4/q A4/q B4/q C5/q |`);
    const layout = calculateSongLayout(node, { width: 600 });
    const pos = getSongPlayhead(layout, 0, 4);
    expect(pos.drum).toBeUndefined();
  });
});
