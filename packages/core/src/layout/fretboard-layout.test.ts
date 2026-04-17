import { describe, expect, it } from 'vitest';
import { parseBlock } from '../parser/parser.js';
import type { FretboardNode } from '../ast/types.js';
import { calculateFretboardLayout } from './fretboard-layout.js';

function parseFretboard(dsl: string): FretboardNode {
  const n = parseBlock(dsl);
  if (n.type !== 'fretboard') throw new Error('expected fretboard');
  return n;
}

describe('calculateFretboardLayout', () => {
  it('returns 6 strings and fretCount+1 fret lines', () => {
    const node = parseFretboard('fretboard A minor-pentatonic frets:0-12');
    const layout = calculateFretboardLayout(node, { width: 600, height: 180 });
    expect(layout.strings.length).toBe(6);
    expect(layout.frets.length).toBe(13);
  });

  it('distributes frets evenly when equalFrets is true', () => {
    const node = parseFretboard('fretboard A minor-pentatonic frets:0-12');
    const layout = calculateFretboardLayout(node, { width: 600, equalFrets: true });
    const xs = layout.frets.map((f) => f.x);
    const firstGap = (xs[1] ?? 0) - (xs[0] ?? 0);
    const lastGap = (xs[12] ?? 0) - (xs[11] ?? 0);
    expect(firstGap).toBeCloseTo(lastGap, 2);
  });

  it('exposes nutX when fretRange starts at 0', () => {
    const node = parseFretboard('fretboard A minor-pentatonic frets:0-12');
    const layout = calculateFretboardLayout(node, { width: 600 });
    expect(layout.nutX).toBeDefined();
  });

  it('omits nutX when fretRange does not start at 0', () => {
    const node = parseFretboard('fretboard A minor-pentatonic frets:5-12');
    const layout = calculateFretboardLayout(node, { width: 600 });
    expect(layout.nutX).toBeUndefined();
  });

  it('generates fret labels for 3/5/7/9/12', () => {
    const node = parseFretboard('fretboard A minor-pentatonic frets:0-12');
    const layout = calculateFretboardLayout(node, { width: 600 });
    const labelFrets = layout.fretLabels.map((l) => l.fret);
    expect(labelFrets).toContain(3);
    expect(labelFrets).toContain(5);
    expect(labelFrets).toContain(7);
    expect(labelFrets).toContain(9);
    expect(labelFrets).toContain(12);
  });

  it('includes dot positions within fret range', () => {
    const node = parseFretboard('fretboard A minor-pentatonic frets:0-12');
    const layout = calculateFretboardLayout(node, { width: 600 });
    expect(layout.dots.length).toBeGreaterThan(0);
    for (const dot of layout.dots) {
      expect(dot.fret).toBeGreaterThanOrEqual(0);
      expect(dot.fret).toBeLessThanOrEqual(12);
      expect(dot.string).toBeGreaterThanOrEqual(0);
      expect(dot.string).toBeLessThan(6);
    }
  });

  it('marks root dots correctly', () => {
    const node = parseFretboard('fretboard A minor-pentatonic frets:0-12');
    const layout = calculateFretboardLayout(node, { width: 600 });
    const roots = layout.dots.filter((d) => d.isRoot);
    expect(roots.length).toBeGreaterThan(0);
    for (const r of roots) {
      expect(r.note).toBe('A');
    }
  });
});
