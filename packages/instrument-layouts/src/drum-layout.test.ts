import { describe, expect, it } from 'vitest';
import { parseBlock, type DrumNode } from '@oon/core';
import { calculateDrumLayout } from './drum-layout.js';

function parseDrum(dsl: string): DrumNode {
  const n = parseBlock(dsl);
  if (n.type !== 'drum') throw new Error('expected drum');
  return n;
}

describe('calculateDrumLayout', () => {
  it('stacks tracks vertically', () => {
    const node = parseDrum(`drum 4/4
  HH | x-x-x-x-x-x-x-x- |
  SN | ----x-------x--- |
  KK | x-------x------- |`);
    const layout = calculateDrumLayout(node, { width: 400 });
    expect(layout.tracks.length).toBe(3);
    expect(layout.tracks[0]?.y).toBe(0);
    expect(layout.tracks[1]?.y).toBeGreaterThan(0);
    expect(layout.tracks[2]?.y).toBeGreaterThan(layout.tracks[1]?.y ?? 0);
  });

  it('cell count equals resolution * barCount * trackCount', () => {
    const node = parseDrum(`drum 4/4
  HH | x-x-x-x-x-x-x-x- |
  SN | ----x-------x--- |`);
    const layout = calculateDrumLayout(node, { width: 400 });
    expect(layout.cells.length).toBe(16 * 1 * 2);
  });

  it('marks active cells correctly', () => {
    const node = parseDrum(`drum 4/4
  KK | x-------x------- |`);
    const layout = calculateDrumLayout(node, { width: 400 });
    const active = layout.cells.filter((c) => c.active);
    expect(active.length).toBe(2);
    expect(active[0]?.cellIndex).toBe(0);
    expect(active[1]?.cellIndex).toBe(8);
  });

  it('generates barCount+1 bar dividers', () => {
    const node = parseDrum(`drum 4/4
  HH | x-x-x-x-x-x-x-x- | x-x-x-x-x-x-x-x- |`);
    const layout = calculateDrumLayout(node, { width: 400 });
    expect(layout.barDividers.length).toBe(3);
  });

  it('generates (beats-1) beat dividers per bar', () => {
    const node = parseDrum(`drum 4/4
  HH | x-x-x-x-x-x-x-x- |`);
    const layout = calculateDrumLayout(node, { width: 400 });
    expect(layout.beatDividers.length).toBe(3);
  });

  it('height equals trackCount * trackHeight', () => {
    const node = parseDrum(`drum 4/4
  HH | x-x-x-x-x-x-x-x- |
  SN | ----x-------x--- |`);
    const layout = calculateDrumLayout(node, { width: 400, trackHeight: 40 });
    expect(layout.height).toBe(80);
  });

  it('clamps cell width to minCellWidth — layout width can exceed input width', () => {
    // 16비트 × 12마디 = 192셀. width 400, label 56 → 셀당 ≈1.79px.
    // minCellWidth 6 으로 클램프되면 layout.width = 56 + 192*6 = 1208.
    const node = parseDrum(
      `drum 4/4\n  HH | ${'x-x-x-x-x-x-x-x- | '.repeat(11)}x-x-x-x-x-x-x-x- |`,
    );
    const layout = calculateDrumLayout(node, { width: 400, minCellWidth: 6, labelWidth: 56 });
    expect(layout.width).toBeGreaterThan(400);
    for (const cell of layout.cells) {
      expect(cell.width).toBeGreaterThan(0);
    }
  });

  it('layout width fits input width when there is room', () => {
    const node = parseDrum(`drum 4/4
  HH | x-x-x-x-x-x-x-x- |`);
    const layout = calculateDrumLayout(node, { width: 400, minCellWidth: 6, labelWidth: 56 });
    expect(layout.width).toBeCloseTo(400, 2);
  });
});
