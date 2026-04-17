import { describe, expect, it } from 'vitest';
import { calculateKeyboardLayout } from './keyboard-layout.js';

describe('calculateKeyboardLayout', () => {
  it('returns default C3-C5 range', () => {
    const layout = calculateKeyboardLayout();
    expect(layout.lowMidi).toBe(48);
    expect(layout.highMidi).toBe(72);
  });

  it('produces correct white/black key counts for C3-C5', () => {
    const layout = calculateKeyboardLayout({ lowMidi: 48, highMidi: 72 });
    const whites = layout.keys.filter((k) => !k.isBlack);
    const blacks = layout.keys.filter((k) => k.isBlack);
    expect(whites.length).toBe(15);
    expect(blacks.length).toBe(10);
  });

  it('width equals number of white keys times whiteKeyWidth', () => {
    const layout = calculateKeyboardLayout({ lowMidi: 60, highMidi: 72, whiteKeyWidth: 20 });
    const whites = layout.keys.filter((k) => !k.isBlack);
    expect(layout.width).toBe(whites.length * 20);
  });

  it('black keys are narrower and shorter than white keys', () => {
    const layout = calculateKeyboardLayout();
    const white = layout.keys.find((k) => !k.isBlack);
    const black = layout.keys.find((k) => k.isBlack);
    expect(white).toBeDefined();
    expect(black).toBeDefined();
    if (!white || !black) return;
    expect(black.rect.width).toBeLessThan(white.rect.width);
    expect(black.rect.height).toBeLessThan(white.rect.height);
  });

  it('highlights specified midi notes', () => {
    const layout = calculateKeyboardLayout({ highlighted: new Set([60, 64, 67]) });
    const c4 = layout.keys.find((k) => k.midi === 60);
    const e4 = layout.keys.find((k) => k.midi === 64);
    const d4 = layout.keys.find((k) => k.midi === 62);
    expect(c4?.highlighted).toBe(true);
    expect(e4?.highlighted).toBe(true);
    expect(d4?.highlighted).toBe(false);
  });

  it('sets labels when showLabels is true', () => {
    const layout = calculateKeyboardLayout({ lowMidi: 60, highMidi: 60, showLabels: true });
    expect(layout.keys[0]?.label).toBeTruthy();
  });

  it('omits labels when showLabels is false', () => {
    const layout = calculateKeyboardLayout({ lowMidi: 60, highMidi: 60 });
    expect(layout.keys[0]?.label).toBeUndefined();
  });
});
