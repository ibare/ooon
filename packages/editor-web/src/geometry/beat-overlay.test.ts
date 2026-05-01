import { describe, expect, it } from 'vitest';
import type { ScoreLayout } from '@oon/score-engraving';
import type { ScoreNode } from '@oon/core';
import { calculateBeatSlots, groupBeatSlots } from './beat-overlay.js';

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
  return makeNodeTs({ beats: 4, beatValue: 4 }, beats);
}

function makeNodeTs(
  timeSignature: { beats: number; beatValue: number },
  beats: number[],
): ScoreNode {
  return {
    type: 'score',
    timeSignature,
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

describe('calculateBeatSlots — 그룹 메타', () => {
  it('4/4 단일 그룹: 모든 슬롯 groupIndex=0, 첫 슬롯만 isGroupStart', () => {
    const slots = calculateBeatSlots(makeLayout(), makeNodeEmpty());
    expect(slots.map((s) => s.groupIndex)).toEqual([0, 0, 0, 0]);
    expect(slots.map((s) => s.isGroupStart)).toEqual([true, false, false, false]);
    expect(slots.map((s) => s.beatInGroup)).toEqual([0, 1, 2, 3]);
  });

  it('6/8 컴파운드 [3,3]: 슬롯 6개가 두 그룹으로 나뉨', () => {
    const slots = calculateBeatSlots(
      makeLayout(),
      makeNodeTs({ beats: 6, beatValue: 8 }, []),
    );
    expect(slots.map((s) => s.beatIndex)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(slots.map((s) => s.groupIndex)).toEqual([0, 0, 0, 1, 1, 1]);
    expect(slots.map((s) => s.isGroupStart)).toEqual([true, false, false, true, false, false]);
    expect(slots.map((s) => s.beatInGroup)).toEqual([0, 1, 2, 0, 1, 2]);
  });

  it('6/8에서 q.(=3박) 사용 후엔 두 번째 그룹만 남음', () => {
    const slots = calculateBeatSlots(
      makeLayout(),
      makeNodeTs({ beats: 6, beatValue: 8 }, [3]),
    );
    expect(slots.map((s) => s.beatIndex)).toEqual([3, 4, 5]);
    expect(slots.map((s) => s.groupIndex)).toEqual([1, 1, 1]);
    expect(slots.map((s) => s.isGroupStart)).toEqual([true, false, false]);
    expect(slots.map((s) => s.beatInGroup)).toEqual([0, 1, 2]);
  });

  it('6/8에서 부분 슬롯(분수 박자)도 진행 중인 그룹에 속함', () => {
    // q+e(2박) 사용 → cursor=2. fractional=0이므로 부분 슬롯 없음.
    // 더 명확하게: 0.5박만 사용 → cursor=0.5, 부분 슬롯 beatIndex=0.5(폭 0.5박), 이후 1,2,3,4,5.
    const slots = calculateBeatSlots(
      makeLayout(),
      makeNodeTs({ beats: 6, beatValue: 8 }, [0.5]),
    );
    expect(slots.map((s) => s.beatIndex)).toEqual([0.5, 1, 2, 3, 4, 5]);
    expect(slots.map((s) => s.groupIndex)).toEqual([0, 0, 0, 1, 1, 1]);
    // 부분 슬롯은 그룹 시작이 아님(0.5는 경계 0과 일치하지 않음).
    expect(slots[0]?.isGroupStart).toBe(false);
    expect(slots[0]?.beatInGroup).toBeCloseTo(0.5, 5);
    // 두 번째 그룹의 첫 슬롯(beatIndex=3)은 isGroupStart=true.
    expect(slots[3]?.isGroupStart).toBe(true);
  });

  it('카탈로그 미정의 박자(11/8)는 단일 그룹으로 fallback', () => {
    const slots = calculateBeatSlots(
      makeLayout(),
      makeNodeTs({ beats: 11, beatValue: 8 }, []),
    );
    expect(slots).toHaveLength(11);
    expect(slots.every((s) => s.groupIndex === 0)).toBe(true);
    // 첫 슬롯만 isGroupStart=true.
    expect(slots.map((s) => s.isGroupStart)).toEqual([
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
  });

  it('5/4 비대칭 [3,2]: 슬롯 5개가 3+2로 분할', () => {
    const slots = calculateBeatSlots(
      makeLayout(),
      makeNodeTs({ beats: 5, beatValue: 4 }, []),
    );
    expect(slots.map((s) => s.groupIndex)).toEqual([0, 0, 0, 1, 1]);
    expect(slots.map((s) => s.isGroupStart)).toEqual([true, false, false, true, false]);
  });
});

describe('groupBeatSlots — 메인박 단위 union rect', () => {
  it('빈 4/4([4]) 단일 그룹 → 그룹 1개, 멤버 4개, union 폭 = 4박 합', () => {
    const slots = calculateBeatSlots(makeLayout(), makeNodeEmpty());
    const groups = groupBeatSlots(slots);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.groupIndex).toBe(0);
    expect(groups[0]?.members).toHaveLength(4);
    const expectedWidth = slots[3]!.x + slots[3]!.width - slots[0]!.x;
    expect(groups[0]?.width).toBeCloseTo(expectedWidth, 5);
  });

  it('빈 6/8([3,3]) → 그룹 2개, 각 멤버 3개씩', () => {
    const slots = calculateBeatSlots(
      makeLayout(),
      makeNodeTs({ beats: 6, beatValue: 8 }, []),
    );
    const groups = groupBeatSlots(slots);
    expect(groups).toHaveLength(2);
    expect(groups.map((g) => g.groupIndex)).toEqual([0, 1]);
    expect(groups.map((g) => g.members.length)).toEqual([3, 3]);
  });

  it('6/8에서 q.(=3박) 사용 후엔 두 번째 그룹 union 1개만 반환', () => {
    const slots = calculateBeatSlots(
      makeLayout(),
      makeNodeTs({ beats: 6, beatValue: 8 }, [3]),
    );
    const groups = groupBeatSlots(slots);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.groupIndex).toBe(1);
    expect(groups[0]?.members).toHaveLength(3);
  });

  it('5/4([3,2]) → 그룹 2개, 멤버 3·2', () => {
    const slots = calculateBeatSlots(
      makeLayout(),
      makeNodeTs({ beats: 5, beatValue: 4 }, []),
    );
    const groups = groupBeatSlots(slots);
    expect(groups.map((g) => g.members.length)).toEqual([3, 2]);
  });

  it('빈 입력은 빈 배열 반환', () => {
    expect(groupBeatSlots([])).toEqual([]);
  });

  it('union rect 좌표는 첫 슬롯 x ~ 마지막 슬롯 우측, y/height는 동일', () => {
    const slots = calculateBeatSlots(
      makeLayout(),
      makeNodeTs({ beats: 6, beatValue: 8 }, []),
    );
    const groups = groupBeatSlots(slots);
    expect(groups[0]?.x).toBe(slots[0]!.x);
    expect(groups[0]?.y).toBe(slots[0]!.y);
    expect(groups[0]?.height).toBe(slots[0]!.height);
    expect(groups[0]?.width).toBeCloseTo(
      slots[2]!.x + slots[2]!.width - slots[0]!.x,
      5,
    );
  });
});
