import { describe, expect, it } from 'vitest';
import type { ScoreLayout } from '@oon/score-engraving';
import type { ScoreNode } from '@oon/core';
import { calculateBeatSlots } from './beat-overlay.js';

// 슬롯 생성 로직 자체만 검증하는 단위 테스트.
// staff/clef/keySig/timeSig는 calculateBeatSlots가 staff.{top,bottom,lineGap}만 참조하므로
// 다른 필드는 더미 값으로 채운다.
function makeLayout(): ScoreLayout {
  return {
    width: 400,
    height: 60,
    systems: [
      {
        index: 0,
        y: 0,
        height: 60,
        staff: { y: 30, top: 10, bottom: 50, lineGap: 10, lines: [10, 20, 30, 40, 50] },
        clef: { x: 0, y: 0, glyph: '' },
        keySig: [],
        timeSig: { x: 0, topGlyph: '', topY: 0, bottomGlyph: '', bottomY: 0 },
        contentStart: 100,
        bars: [{ barNumber: 1, x: 100, width: 200, barlineX: 300, notes: [], beams: [] }],
      },
    ],
  };
}

function makeNodeEmpty(): ScoreNode {
  return makeNode([]);
}

function makeNode(beats: number[]): ScoreNode {
  return {
    type: 'score',
    timeSignature: { beats: 4, beatValue: 4 },
    bpm: 120,
    bars: [
      {
        barNumber: 1,
        notes: beats.map((b) => ({ pitch: 'C4', duration: 'q', beats: b, isRest: false })),
      },
    ],
    warnings: [],
  };
}

describe('calculateBeatSlots — 남은 박자 영역 노출', () => {
  it('빈 4/4 마디는 4개 슬롯(beatIndex 0,1,2,3) 모두 표시', () => {
    const slots = calculateBeatSlots(makeLayout(), makeNodeEmpty());
    expect(slots.map((s) => s.beatIndex)).toEqual([0, 1, 2, 3]);
  });

  it('4분음표 1개 추가 후에는 3개 슬롯(beatIndex 1,2,3)만 남음', () => {
    const slots = calculateBeatSlots(makeLayout(), makeNode([1]));
    expect(slots.map((s) => s.beatIndex)).toEqual([1, 2, 3]);
  });

  it('4/4가 가득 채워지면 슬롯 0개', () => {
    const slots = calculateBeatSlots(
      makeLayout(),
      makeNode([1, 1, 1, 1]),
    );
    expect(slots).toEqual([]);
  });

  it('점4분음표(1.5박) 사용 후엔 박자 1.5~2 부분 슬롯 + 박자 2,3 정수 슬롯 = 슬롯 3개', () => {
    const slots = calculateBeatSlots(makeLayout(), makeNode([1.5]));
    expect(slots.map((s) => s.beatIndex)).toEqual([1.5, 2, 3]);
  });

  it('e 1개(0.5박) 사용 후엔 슬롯 4개: 부분 슬롯 + 정수 슬롯 3개 (사용자 보고 케이스)', () => {
    const slots = calculateBeatSlots(makeLayout(), makeNode([0.5]));
    expect(slots.map((s) => s.beatIndex)).toEqual([0.5, 1, 2, 3]);
  });

  it('q+e(1.5박) 사용 후엔 0.5박 부분 슬롯 + 정수 슬롯 2개 (사용자 보고 케이스)', () => {
    const slots = calculateBeatSlots(makeLayout(), makeNode([1, 0.5]));
    expect(slots.map((s) => s.beatIndex)).toEqual([1.5, 2, 3]);
    // 부분 슬롯 폭은 정수 슬롯 폭의 절반.
    const fullBeatPx = slots[1]?.width ?? 0;
    expect(slots[0]?.width).toBeCloseTo(fullBeatPx / 2, 5);
    expect(slots[2]?.width).toBeCloseTo(fullBeatPx, 5);
  });

  it('슬롯 폭은 (마디 inner usable) / beatsPerBar', () => {
    // bar.x=100, barlineX=300, lineGap=10이라 innerPad=6. usable=200-12=188. slotWidth=47.
    const slots = calculateBeatSlots(makeLayout(), makeNodeEmpty());
    expect(slots[0]?.width).toBeCloseTo(47, 5);
    // 첫 슬롯의 x = bar.x + innerPad = 106
    expect(slots[0]?.x).toBeCloseTo(106, 5);
    // 두 번째 슬롯의 x = 106 + 47 = 153
    expect(slots[1]?.x).toBeCloseTo(153, 5);
  });
});
