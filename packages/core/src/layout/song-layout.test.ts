import { describe, expect, it } from 'vitest';
import { parseBlock } from '../parser/parser.js';
import type { SongNode } from '../ast/types.js';
import { calculateSongLayout } from './song-layout.js';

function parseSong(dsl: string): SongNode {
  const n = parseBlock(dsl);
  if (n.type !== 'song') throw new Error('expected song');
  return n;
}

const SONG_WITHOUT_DRUM = `song 4/4 key:C bpm:100
  C | G | Am | F |
  C4/q D4/q E4/q F4/q | G4/q A4/q B4/q C5/q | E4/q D4/q C4/q B3/q | A3/q G3/q F3/q E3/q |`;

const SONG_WITH_DRUM = `song 4/4 key:C bpm:100
  beat: 8beat-rock
  C | G |
  C4/q D4/q E4/q F4/q | G4/q A4/q B4/q C5/q |`;

describe('calculateSongLayout', () => {
  it('produces chord + score rows when no beat specified', () => {
    const node = parseSong(SONG_WITHOUT_DRUM);
    const layout = calculateSongLayout(node, { width: 600 });
    expect(layout.chordRow).toBeDefined();
    expect(layout.scoreRow).toBeDefined();
    expect(layout.drumRow).toBeUndefined();
  });

  it('adds drum row when song has beat', () => {
    const node = parseSong(SONG_WITH_DRUM);
    const layout = calculateSongLayout(node, { width: 600 });
    expect(layout.drumRow).toBeDefined();
  });

  it('rows stack vertically with increasing y', () => {
    const node = parseSong(SONG_WITH_DRUM);
    const layout = calculateSongLayout(node, { width: 600, gap: 10 });
    expect(layout.chordRow.y).toBe(0);
    expect(layout.scoreRow.y).toBeGreaterThanOrEqual(layout.chordRow.y + layout.chordRow.height);
    expect(layout.drumRow).toBeDefined();
    if (layout.drumRow) {
      expect(layout.drumRow.y).toBeGreaterThanOrEqual(layout.scoreRow.y + layout.scoreRow.height);
    }
  });

  it('chord row contains one card per bar', () => {
    const node = parseSong(SONG_WITHOUT_DRUM);
    const layout = calculateSongLayout(node, { width: 600 });
    expect(layout.chordRow.cards.length).toBe(4);
  });

  it('score row contains one score bar per song bar', () => {
    const node = parseSong(SONG_WITHOUT_DRUM);
    const layout = calculateSongLayout(node, { width: 600 });
    expect(layout.scoreRow.score.bars.length).toBe(4);
  });

  it('total height includes all rows', () => {
    const node = parseSong(SONG_WITH_DRUM);
    const layout = calculateSongLayout(node, { width: 600 });
    expect(layout.height).toBeGreaterThan(layout.chordRow.height);
    expect(layout.height).toBeGreaterThan(layout.scoreRow.height);
  });

  it('width matches option', () => {
    const node = parseSong(SONG_WITHOUT_DRUM);
    const layout = calculateSongLayout(node, { width: 800 });
    expect(layout.width).toBe(800);
  });
});
