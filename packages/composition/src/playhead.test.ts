import { describe, expect, it } from 'vitest';
import { parseBlock, type SongNode } from '@oon/core';
import { calculateSongLayout } from './song-layout.js';
import { getSongPlayhead, getSongActiveNotes } from './playhead.js';

function parseSong(dsl: string): SongNode {
  const n = parseBlock(dsl);
  if (n.type !== 'song') throw new Error('expected song');
  return n;
}

const SONG_WITH_DRUM = `song 4/4 key:C bpm:100
  beat: 8beat-rock
  C | G |
  C4/q D4/q E4/q F4/q | G4/q A4/q B4/q C5/q |`;

const SONG_NO_DRUM = `song 4/4 key:C bpm:100
  C | G |
  C4/q D4/q E4/q F4/q | G4/q A4/q B4/q C5/q |`;

describe('getSongPlayhead', () => {
  it('returns chord/score/drum positions when drum row exists', () => {
    const node = parseSong(SONG_WITH_DRUM);
    const layout = calculateSongLayout(node, { width: 600 });
    const pos = getSongPlayhead(layout, 0, 4);
    expect(pos.systemIndex).toBeGreaterThanOrEqual(0);
    expect(pos.chord).toBeDefined();
    expect(pos.score).toBeDefined();
    expect(pos.drum).toBeDefined();
  });

  it('row y is absolute (>= system y + row inner y)', () => {
    const node = parseSong(SONG_WITH_DRUM);
    const layout = calculateSongLayout(node, { width: 600 });
    const pos = getSongPlayhead(layout, 0, 4);
    const sys = layout.systems[pos.systemIndex]!;
    expect(pos.chord!.y).toBe(sys.y + sys.progression!.y);
    expect(pos.drum!.y).toBe(sys.y + sys.drum!.y);
    if (pos.score) {
      expect(pos.score.y).toBeGreaterThanOrEqual(sys.y);
    }
  });

  it('chord x equals first bar card.x at beat 0', () => {
    const node = parseSong(SONG_WITH_DRUM);
    const layout = calculateSongLayout(node, { width: 600 });
    const pos = getSongPlayhead(layout, 0, 4);
    const sys = layout.systems[0]!;
    expect(pos.chord!.x).toBeCloseTo(sys.progression!.cards[0]!.rect.x, 5);
  });

  it('chord and drum advance to next bar at beat=4 (within same system)', () => {
    const node = parseSong(SONG_WITH_DRUM);
    const layout = calculateSongLayout(node, { width: 600 });
    const pos = getSongPlayhead(layout, 4, 4);
    const sys = layout.systems[pos.systemIndex]!;
    // 한 system에 2마디가 들어가므로 beat=4는 같은 system 안에서 두번째 카드 시작
    expect(pos.chord!.x).toBeCloseTo(sys.progression!.cards[1]!.rect.x, 5);
    expect(pos.drum!.x).toBeCloseTo(sys.drum!.layout.barDividers[1]!.x, 5);
  });

  it('omits drum when no drum row', () => {
    const node = parseSong(SONG_NO_DRUM);
    const layout = calculateSongLayout(node, { width: 600 });
    const pos = getSongPlayhead(layout, 0, 4);
    expect(pos.drum).toBeUndefined();
  });

  it('score x advances across wrapped systems (not stuck at first bar)', () => {
    // 좁은 width로 system이 2개 이상 생기는 곡
    const dsl = `song 4/4 key:C bpm:100
  C | G | Am | F | C | G | Am | F | C | G |
  C4/w | G4/w | A4/w | F4/w | C4/w | G4/w | A4/w | F4/w | C4/w | G4/w |`;
    const node = parseSong(dsl);
    const layout = calculateSongLayout(node, { width: 600 });
    expect(layout.systems.length).toBeGreaterThanOrEqual(2);

    const sys1 = layout.systems[1]!;
    const sys1Bars = sys1.score.layout.systems[0]!.bars;
    const sys1FirstBarBeat = sys1Bars[0]!.barNumber - 1; // 0-based
    const beatsPerBar = 4;
    const sys1StartBeat = sys1FirstBarBeat * beatsPerBar;

    // system 1 첫 마디 시작
    const posStart = getSongPlayhead(layout, sys1StartBeat, beatsPerBar);
    expect(posStart.systemIndex).toBe(1);
    expect(posStart.score!.x).toBeCloseTo(sys1Bars[0]!.x, 5);

    // system 1 두 번째 마디 시작 — 첫 마디 시작에 멈춰 있으면 안 됨
    const posSecond = getSongPlayhead(layout, sys1StartBeat + beatsPerBar, beatsPerBar);
    expect(posSecond.systemIndex).toBe(1);
    expect(posSecond.score!.x).toBeCloseTo(sys1Bars[1]!.x, 5);
    expect(posSecond.score!.x).toBeGreaterThan(sys1Bars[0]!.x);

    // system 1 첫 마디 중간(beat 절반) — 첫 마디 x보다 진행해야 함
    const posMid = getSongPlayhead(layout, sys1StartBeat + beatsPerBar / 2, beatsPerBar);
    expect(posMid.systemIndex).toBe(1);
    expect(posMid.score!.x).toBeCloseTo(
      sys1Bars[0]!.x + sys1Bars[0]!.width / 2,
      5,
    );
  });
});

describe('getSongActiveNotes', () => {
  // 고정 옥타브 정책: root MIDI = 48 + pc, intervals [0,4,7]
  it('C major → C3/E3/G3 (48/52/55)', () => {
    const node = parseSong(SONG_WITH_DRUM);
    const active = getSongActiveNotes(node, 0, 4);
    expect([...active.chordMidis].sort((a, b) => a - b)).toEqual([48, 52, 55]);
  });

  it('returns melody midi for current beat (beat=0 → C4)', () => {
    const node = parseSong(SONG_WITH_DRUM);
    const active = getSongActiveNotes(node, 0, 4);
    expect(active.melodyMidi).toBe(60);
  });

  it('G major → G3/B3/D4 (55/59/62) regardless of melody', () => {
    const node = parseSong(SONG_WITH_DRUM);
    const active = getSongActiveNotes(node, 4, 4);
    expect([...active.chordMidis].sort((a, b) => a - b)).toEqual([55, 59, 62]);
    expect(active.melodyMidi).toBe(67);
  });

  it('past end clamps to last bar (G voicing)', () => {
    const node = parseSong(SONG_WITH_DRUM);
    const active = getSongActiveNotes(node, 100, 4);
    expect([...active.chordMidis].sort((a, b) => a - b)).toEqual([55, 59, 62]);
  });

  it('returns rootMidi at fixed octave (C major → 48, G major → 55)', () => {
    const node = parseSong(SONG_WITH_DRUM);
    expect(getSongActiveNotes(node, 0, 4).rootMidi).toBe(48);
    expect(getSongActiveNotes(node, 4, 4).rootMidi).toBe(55);
  });
});
