import { describe, expect, it } from 'vitest';
import { parseBlock, type ScoreNode } from '@oon/core';
import { calculateScoreLayout } from './score-layout.js';
import { getScorePlayhead } from './playhead.js';

function parseScore(dsl: string): ScoreNode {
  const n = parseBlock(dsl);
  if (n.type !== 'score') throw new Error('expected score');
  return n;
}

describe('getScorePlayhead', () => {
  it('returns null for empty layout', () => {
    const node = parseScore('score 4/4\n  A4/q B4/q C5/q D5/q |');
    const layout = calculateScoreLayout(node, { width: 400 });
    layout.systems.length = 0;
    expect(getScorePlayhead(layout, 0, 4)).toBeNull();
  });

  it('places playhead at the first bar start when beat=0', () => {
    const node = parseScore('score 4/4\n  A4/q B4/q C5/q D5/q |');
    const layout = calculateScoreLayout(node, { width: 400 });
    const pos = getScorePlayhead(layout, 0, 4);
    expect(pos).not.toBeNull();
    if (!pos) return;
    expect(pos.systemIndex).toBe(0);
    const firstBar = layout.systems[0]!.bars[0]!;
    expect(pos.x).toBeCloseTo(firstBar.x, 5);
  });

  it('interpolates within a bar (mid-bar = bar.x + bar.width/2)', () => {
    const node = parseScore('score 4/4\n  A4/q B4/q C5/q D5/q |');
    const layout = calculateScoreLayout(node, { width: 400 });
    const pos = getScorePlayhead(layout, 2, 4); // 4/4의 절반
    expect(pos).not.toBeNull();
    if (!pos) return;
    const bar = layout.systems[0]!.bars[0]!;
    expect(pos.x).toBeCloseTo(bar.x + bar.width / 2, 5);
  });

  it('snaps to subsequent bar at bar boundary', () => {
    const node = parseScore('score 4/4\n  A4/w | B4/w |');
    const layout = calculateScoreLayout(node, { width: 600 });
    const pos = getScorePlayhead(layout, 4, 4); // 둘째 마디 시작
    expect(pos).not.toBeNull();
    if (!pos) return;
    const bar1 = layout.systems[0]!.bars[1]!;
    expect(pos.x).toBeCloseTo(bar1.x, 5);
  });

  it('clamps beats beyond song range to the last bar end', () => {
    const node = parseScore('score 4/4\n  A4/w | B4/w |');
    const layout = calculateScoreLayout(node, { width: 600 });
    const pos = getScorePlayhead(layout, 100, 4);
    expect(pos).not.toBeNull();
    if (!pos) return;
    const sys = layout.systems[layout.systems.length - 1]!;
    const lastBar = sys.bars[sys.bars.length - 1]!;
    expect(pos.x).toBeCloseTo(lastBar.x + lastBar.width, 5);
  });

  it('locates the correct system when bars wrap across multiple systems', () => {
    const bars = Array.from({ length: 16 }, () => 'A4/w |').join(' ');
    const node = parseScore(`score 4/4\n  ${bars}`);
    const layout = calculateScoreLayout(node, { width: 200 }); // 좁아서 wrap 발생
    expect(layout.systems.length).toBeGreaterThan(1);
    // 마지막 마디(barNumber=16)는 systems[last]에 포함되어 있어야 한다.
    const pos = getScorePlayhead(layout, 15 * 4, 4); // 16번째 마디 시작
    expect(pos).not.toBeNull();
    if (!pos) return;
    const expectSys = layout.systems.findIndex((s) => s.bars.some((b) => b.barNumber === 16));
    expect(pos.systemIndex).toBe(expectSys);
  });
});
