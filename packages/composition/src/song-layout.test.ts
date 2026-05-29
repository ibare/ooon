import { describe, expect, it } from 'vitest';
import { parseBlock, type SongNode } from '@ooon/core';
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
  it('produces keyboard + at least one system', () => {
    const node = parseSong(SONG_WITHOUT_DRUM);
    const layout = calculateSongLayout(node, { width: 600 });
    expect(layout.keyboard).toBeDefined();
    expect(layout.systems.length).toBeGreaterThan(0);
  });

  it('keyboard sits at top (y = 0)', () => {
    const node = parseSong(SONG_WITHOUT_DRUM);
    const layout = calculateSongLayout(node, { width: 600 });
    expect(layout.keyboard.y).toBe(0);
  });

  it('first system starts below keyboard', () => {
    const node = parseSong(SONG_WITHOUT_DRUM);
    const layout = calculateSongLayout(node, { width: 600 });
    expect(layout.systems[0]!.y).toBeGreaterThanOrEqual(layout.keyboard.height);
  });

  it('every system has progression and score; drum only when beat present', () => {
    const node = parseSong(SONG_WITH_DRUM);
    const layout = calculateSongLayout(node, { width: 600 });
    for (const sys of layout.systems) {
      expect(sys.progression).toBeDefined();
      expect(sys.score).toBeDefined();
      expect(sys.drum).toBeDefined();
    }
  });

  it('omits drum block when no beat', () => {
    const node = parseSong(SONG_WITHOUT_DRUM);
    const layout = calculateSongLayout(node, { width: 600 });
    for (const sys of layout.systems) {
      expect(sys.drum).toBeUndefined();
    }
  });

  it('progression cards align to score bars (same x and width per bar)', () => {
    const node = parseSong(SONG_WITHOUT_DRUM);
    const layout = calculateSongLayout(node, { width: 600 });
    for (const sys of layout.systems) {
      const scoreSys = sys.score.layout.systems[0]!;
      expect(sys.progression!.cards.length).toBe(scoreSys.bars.length);
      for (let i = 0; i < scoreSys.bars.length; i += 1) {
        const sb = scoreSys.bars[i]!;
        const card = sys.progression!.cards[i]!;
        expect(card.rect.x).toBeCloseTo(sb.x, 5);
        expect(card.rect.width).toBeCloseTo(sb.width, 5);
      }
    }
  });

  it('drum bar dividers align to score bar boundaries', () => {
    const node = parseSong(SONG_WITH_DRUM);
    const layout = calculateSongLayout(node, { width: 600 });
    const sys = layout.systems[0]!;
    const scoreSys = sys.score.layout.systems[0]!;
    // 첫 마디 시작과 마지막 마디 끝이 일치
    expect(sys.drum!.layout.barDividers[0]!.x).toBeCloseTo(scoreSys.bars[0]!.x, 5);
    const lastBar = scoreSys.bars[scoreSys.bars.length - 1]!;
    const lastDivider = sys.drum!.layout.barDividers[sys.drum!.layout.barDividers.length - 1]!;
    expect(lastDivider.x).toBeCloseTo(lastBar.x + lastBar.width, 5);
  });

  it('systems stack vertically (each next y >= prev bottom)', () => {
    const node = parseSong(SONG_WITHOUT_DRUM);
    const layout = calculateSongLayout(node, { width: 600 });
    for (let i = 1; i < layout.systems.length; i += 1) {
      const prev = layout.systems[i - 1]!;
      const cur = layout.systems[i]!;
      expect(cur.y).toBeGreaterThanOrEqual(prev.y + prev.height);
    }
  });

  it('width is preserved', () => {
    const node = parseSong(SONG_WITHOUT_DRUM);
    const layout = calculateSongLayout(node, { width: 800 });
    expect(layout.width).toBe(800);
  });

  it('keyboard range covers song melody pitches', () => {
    const node = parseSong(SONG_WITHOUT_DRUM);
    const layout = calculateSongLayout(node, { width: 600 });
    // 멜로디 최저 E3=52, 최고 C5=72. 음역은 옥타브 경계로 정렬되므로 lowMidi <= 48, highMidi >= 83
    expect(layout.keyboard.layout.lowMidi).toBeLessThanOrEqual(52);
    expect(layout.keyboard.layout.highMidi).toBeGreaterThanOrEqual(72);
  });
});
