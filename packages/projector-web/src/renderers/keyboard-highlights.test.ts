import { describe, expect, it } from 'vitest';
import { calculateKeyboardLayout } from '@oon/instrument-layouts';
import { drawKeyboardHighlights } from './keyboard-highlights.js';
import { FakeProjector } from '../testing/fake-projector.js';

function rectCalls(p: FakeProjector) {
  return p.calls.filter((c) => c.op === 'drawRect');
}

describe('drawKeyboardHighlights', () => {
  it('does nothing when no active notes', () => {
    const layout = calculateKeyboardLayout({ lowMidi: 60, highMidi: 71 });
    const p = new FakeProjector();
    drawKeyboardHighlights(p, layout, { melodyMidi: null, chordMidis: [] });
    expect(rectCalls(p).length).toBe(0);
  });

  it('highlights only the exact chord voicing midis (single octave)', () => {
    // C3..B5 — voicing C3/E3/G3 = [48,52,55] 세 개만 매칭
    const layout = calculateKeyboardLayout({ lowMidi: 48, highMidi: 83 });
    const p = new FakeProjector();
    drawKeyboardHighlights(p, layout, {
      melodyMidi: null,
      chordMidis: [48, 52, 55],
    });
    expect(rectCalls(p).length).toBe(3);
  });

  it('does not highlight other octaves when only specific midis given', () => {
    // C3/E3/G3만 voicing이면 C4/E4/G4(60/64/67)는 칠해지지 않아야 함
    const layout = calculateKeyboardLayout({ lowMidi: 48, highMidi: 83 });
    const p = new FakeProjector();
    drawKeyboardHighlights(p, layout, {
      melodyMidi: null,
      chordMidis: [48, 52, 55],
    });
    // 정확히 3개
    expect(rectCalls(p).length).toBe(3);
  });

  it('overlays melody key on top of chord (4 rects when melody distinct from chord)', () => {
    const layout = calculateKeyboardLayout({ lowMidi: 48, highMidi: 83 });
    const p = new FakeProjector();
    drawKeyboardHighlights(p, layout, {
      melodyMidi: 60, // melody C4 — chord midis(48/52/55)와 겹치지 않음
      chordMidis: [48, 52, 55],
    });
    expect(rectCalls(p).length).toBe(4);
  });

  it('respects originX/originY translate', () => {
    const layout = calculateKeyboardLayout({ lowMidi: 60, highMidi: 71 });
    const p = new FakeProjector();
    drawKeyboardHighlights(
      p,
      layout,
      { melodyMidi: 60, chordMidis: [] },
      { originX: 50, originY: 30 },
    );
    const translates = p.calls.filter((c) => c.op === 'translate');
    expect(translates.length).toBe(1);
    expect(translates[0]!.args).toEqual([50, 30]);
  });
});
