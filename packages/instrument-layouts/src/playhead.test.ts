import { describe, expect, it } from 'vitest';
import { parseBlock, type DrumNode, type ProgressionNode } from '@oon/core';
import { calculateDrumLayout } from './drum-layout.js';
import { calculateProgressionLayout } from './progression-layout.js';
import { getDrumPlayheadX, getProgressionPlayheadX } from './playhead.js';

function parseDrum(dsl: string): DrumNode {
  const n = parseBlock(dsl);
  if (n.type !== 'drum') throw new Error('expected drum');
  return n;
}

function parseProg(dsl: string): ProgressionNode {
  const n = parseBlock(dsl);
  if (n.type !== 'progression') throw new Error('expected progression');
  return n;
}

const DRUM_DSL = `drum 4/4
  HH | x-x-x-x-x-x-x-x- | x-x-x-x-x-x-x-x- |
  KK | x-------x------- | x-------x------- |`;

describe('getDrumPlayheadX', () => {
  it('starts at first barDivider when beat=0', () => {
    const node = parseDrum(DRUM_DSL);
    const layout = calculateDrumLayout(node, { width: 600 });
    expect(getDrumPlayheadX(layout, 0, 4)).toBeCloseTo(layout.barDividers[0]!.x, 5);
  });

  it('lands exactly on the next bar divider at the bar boundary', () => {
    const node = parseDrum(DRUM_DSL);
    const layout = calculateDrumLayout(node, { width: 600 });
    expect(getDrumPlayheadX(layout, 4, 4)).toBeCloseTo(layout.barDividers[1]!.x, 5);
  });

  it('interpolates within a bar', () => {
    const node = parseDrum(DRUM_DSL);
    const layout = calculateDrumLayout(node, { width: 600 });
    const start = layout.barDividers[0]!.x;
    const next = layout.barDividers[1]!.x;
    const mid = start + (next - start) / 2;
    expect(getDrumPlayheadX(layout, 2, 4)).toBeCloseTo(mid, 5);
  });

  it('clamps to last bar end for beats beyond song range', () => {
    const node = parseDrum(DRUM_DSL);
    const layout = calculateDrumLayout(node, { width: 600 });
    const last = layout.barDividers[layout.barDividers.length - 1]!.x;
    expect(getDrumPlayheadX(layout, 999, 4)).toBeCloseTo(last, 5);
  });

  it('clamps to first bar start for negative beats', () => {
    const node = parseDrum(DRUM_DSL);
    const layout = calculateDrumLayout(node, { width: 600 });
    expect(getDrumPlayheadX(layout, -10, 4)).toBeCloseTo(layout.barDividers[0]!.x, 5);
  });
});

describe('getProgressionPlayheadX', () => {
  it('starts at first card x for beat=0', () => {
    const node = parseProg('progression 4/4 in:C\n  I | V | vi | IV |');
    const layout = calculateProgressionLayout(node, { width: 600 });
    expect(getProgressionPlayheadX(layout, 0, 4)).toBeCloseTo(layout.cards[0]!.rect.x, 5);
  });

  it('lands on next card start at bar boundary', () => {
    const node = parseProg('progression 4/4 in:C\n  I | V | vi | IV |');
    const layout = calculateProgressionLayout(node, { width: 600 });
    expect(getProgressionPlayheadX(layout, 4, 4)).toBeCloseTo(layout.cards[1]!.rect.x, 5);
  });

  it('interpolates within a card', () => {
    const node = parseProg('progression 4/4 in:C\n  I |');
    const layout = calculateProgressionLayout(node, { width: 600 });
    const card = layout.cards[0]!;
    expect(getProgressionPlayheadX(layout, 1, 4)).toBeCloseTo(card.rect.x + card.rect.width / 4, 5);
  });

  it('clamps beats beyond range to last card right edge', () => {
    const node = parseProg('progression 4/4 in:C\n  I | V |');
    const layout = calculateProgressionLayout(node, { width: 600 });
    const last = layout.cards[1]!;
    expect(getProgressionPlayheadX(layout, 999, 4)).toBeCloseTo(last.rect.x + last.rect.width, 5);
  });
});
