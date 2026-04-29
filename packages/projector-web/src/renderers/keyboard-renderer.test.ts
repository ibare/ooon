import { describe, expect, it } from 'vitest';
import { calculateKeyboardLayout } from '@oon/instrument-layouts';
import { renderKeyboard } from './keyboard-renderer.js';
import { FakeProjector } from '../testing/fake-projector.js';

describe('renderKeyboard', () => {
  it('draws rect for every key and registers one hit area per key', () => {
    const layout = calculateKeyboardLayout({ lowMidi: 60, highMidi: 72 });
    const projector = new FakeProjector();
    renderKeyboard(projector, layout);
    const rectCalls = projector.countOps('drawRect');
    expect(rectCalls).toBe(layout.keys.length);
    expect(projector.hitAreas.length).toBe(layout.keys.length);
  });

  it('draws white keys before black keys', () => {
    const layout = calculateKeyboardLayout({ lowMidi: 60, highMidi: 72 });
    const projector = new FakeProjector();
    renderKeyboard(projector, layout);
    const whiteCount = layout.keys.filter((k) => !k.isBlack).length;
    const firstNonWhite = projector.callsOf('drawRect').findIndex((c, i) => {
      if (i >= whiteCount) return true;
      return false;
    });
    expect(firstNonWhite).toBe(whiteCount);
  });

  it('draws labels only when showLabels is true', () => {
    const layout = calculateKeyboardLayout({ lowMidi: 60, highMidi: 60, showLabels: true });
    const a = new FakeProjector();
    const b = new FakeProjector();
    renderKeyboard(a, layout, { showLabels: true });
    renderKeyboard(b, layout, { showLabels: false });
    expect(a.countOps('drawText')).toBeGreaterThan(0);
    expect(b.countOps('drawText')).toBe(0);
  });
});
