import { describe, expect, it } from 'vitest';
import { parseBlock, type SongNode } from '@oon/core';
import { calculateSongLayout } from '@oon/composition';
import { drawSongPlayheadOverlay } from './playhead-overlay.js';
import { FakeProjector } from '../testing/fake-projector.js';

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

describe('drawSongPlayheadOverlay', () => {
  it('draws three vertical lines (chord + score + drum) when drum row exists', () => {
    const node = parseSong(SONG_WITH_DRUM);
    const layout = calculateSongLayout(node, { width: 600 });
    const projector = new FakeProjector();
    drawSongPlayheadOverlay(projector, layout, 0, 4);
    const lines = projector.calls.filter((c) => c.op === 'drawLine');
    expect(lines.length).toBe(3);
  });

  it('draws two vertical lines when drum row is omitted', () => {
    const node = parseSong(SONG_NO_DRUM);
    const layout = calculateSongLayout(node, { width: 600 });
    const projector = new FakeProjector();
    drawSongPlayheadOverlay(projector, layout, 0, 4);
    const lines = projector.calls.filter((c) => c.op === 'drawLine');
    expect(lines.length).toBe(2);
  });

  it('lines are vertical (x is constant per row)', () => {
    const node = parseSong(SONG_NO_DRUM);
    const layout = calculateSongLayout(node, { width: 600 });
    const projector = new FakeProjector();
    drawSongPlayheadOverlay(projector, layout, 2, 4);
    const lines = projector.calls.filter((c) => c.op === 'drawLine');
    for (const call of lines) {
      const [from, to] = call.args as [{ x: number; y: number }, { x: number; y: number }];
      expect(from.x).toBeCloseTo(to.x, 5);
      expect(from.y).not.toBe(to.y);
    }
  });

  it('respects originX/originY offsets', () => {
    const node = parseSong(SONG_NO_DRUM);
    const layout = calculateSongLayout(node, { width: 600 });
    const baseProjector = new FakeProjector();
    drawSongPlayheadOverlay(baseProjector, layout, 1, 4);
    const offsetProjector = new FakeProjector();
    drawSongPlayheadOverlay(offsetProjector, layout, 1, 4, { originX: 50, originY: 30 });

    const baseLines = baseProjector.calls.filter((c) => c.op === 'drawLine');
    const offsetLines = offsetProjector.calls.filter((c) => c.op === 'drawLine');
    expect(baseLines.length).toBe(offsetLines.length);
    for (let i = 0; i < baseLines.length; i += 1) {
      const [bFrom] = baseLines[i]!.args as [{ x: number; y: number }];
      const [oFrom] = offsetLines[i]!.args as [{ x: number; y: number }];
      expect(oFrom.x - bFrom.x).toBeCloseTo(50, 5);
      expect(oFrom.y - bFrom.y).toBeCloseTo(30, 5);
    }
  });
});
