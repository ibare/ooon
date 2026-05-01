import type { ScoreLayout, ScoreBarLayout, ScoreSystemLayout } from '@oon/score-engraving';
import { getBeatGroups, type ScoreNode } from '@oon/core';

export interface BeatSlotRect {
  systemIndex: number;
  barIndex: number; // ScoreNode.bars 내 인덱스 (0-based)
  beatIndex: number; // 슬롯이 시작하는 박자 위치(0-based, 정수 또는 분수)
  x: number;
  y: number;
  width: number;
  height: number;
  /** 슬롯이 속한 음악적 메인박 그룹 인덱스(0-based). 6/8([3,3])이면 0 또는 1. */
  groupIndex: number;
  /** 그룹 시작점으로부터의 작은박 오프셋(분수 가능, 부분 슬롯이면 비정수). */
  beatInGroup: number;
  /** 슬롯의 beatIndex가 그룹 경계와 정확히 일치하는가(부분 슬롯은 false). */
  isGroupStart: boolean;
}

// 박자 슬롯은 "남은 박자 영역"을 가변 폭 슬롯 시퀀스로 표현한다.
// usedBeats가 분수면 다음 정수 박자 경계까지 폭이 좁은 부분 슬롯 하나(예: 8분음표 자리)를
// 노출하고, 그 이후부터는 1박 폭의 정수 박자 슬롯들을 노출한다.
// 예) 4/4에 q + e(=1.5박 사용) → 슬롯 3개: [1.5~2 폭=0.5박, 2~3 폭=1박, 3~4 폭=1박].
export function calculateBeatSlots(
  layout: ScoreLayout,
  node: ScoreNode,
): BeatSlotRect[] {
  const beatsPerBar = node.timeSignature.beats;
  if (beatsPerBar <= 0) return [];

  const groups = getBeatGroups(node.timeSignature);
  const result: BeatSlotRect[] = [];
  for (const system of layout.systems) {
    for (const bar of system.bars) {
      const barIdx = bar.barNumber - 1;
      const sourceBar = node.bars[barIdx];
      if (!sourceBar) continue;
      const usedBeats = sourceBar.notes.reduce((sum, n) => sum + n.beats, 0);
      if (usedBeats >= beatsPerBar - 1e-9) continue;
      result.push(...slotsForBar(system, bar, barIdx, beatsPerBar, usedBeats, groups));
    }
  }
  return result;
}

// beatIndex가 어느 그룹에 속하는지 누적 경계로 판정.
// 부분 슬롯(분수 beatIndex)도 진행 중인 그룹에 포함된다.
function locateGroup(beatIndex: number, groups: readonly number[]): {
  groupIndex: number;
  beatInGroup: number;
  isGroupStart: boolean;
} {
  let cum = 0;
  for (let g = 0; g < groups.length; g++) {
    const next = cum + (groups[g] ?? 0);
    // 마지막 그룹이거나 beatIndex가 다음 경계 미만이면 이 그룹.
    if (g === groups.length - 1 || beatIndex < next - 1e-9) {
      return {
        groupIndex: g,
        beatInGroup: beatIndex - cum,
        isGroupStart: Math.abs(beatIndex - cum) < 1e-9,
      };
    }
    cum = next;
  }
  // groups가 비어있을 수 없는 invariant이지만 type-safe fallback.
  return { groupIndex: 0, beatInGroup: beatIndex, isGroupStart: beatIndex < 1e-9 };
}

function slotsForBar(
  system: ScoreSystemLayout,
  bar: ScoreBarLayout,
  barIndex: number,
  beats: number,
  usedBeats: number,
  groups: readonly number[],
): BeatSlotRect[] {
  const innerPad = system.staff.lineGap * 0.6;
  const x0 = bar.x + innerPad;
  const x1 = bar.barlineX - innerPad;
  const usable = Math.max(0, x1 - x0);
  const beatPx = usable / beats;
  const y = system.staff.top;
  const height = system.staff.bottom - system.staff.top;
  const slots: BeatSlotRect[] = [];

  let cursor = usedBeats;
  // 첫 슬롯이 박자 경계에 정렬되지 않으면 다음 정수 박자까지를 부분 슬롯으로 노출.
  // 점4분(1.5박) 사용 후 0.5박 빈 영역에 8분음표 슬롯이 보이도록 하기 위함.
  const fractional = cursor - Math.floor(cursor + 1e-9);
  if (cursor < beats - 1e-9 && fractional > 1e-9) {
    const nextInt = Math.floor(cursor + 1e-9) + 1;
    const slotBeats = nextInt - cursor;
    const meta = locateGroup(cursor, groups);
    slots.push({
      systemIndex: system.index,
      barIndex,
      beatIndex: cursor,
      x: x0 + cursor * beatPx,
      y,
      width: slotBeats * beatPx,
      height,
      ...meta,
    });
    cursor = nextInt;
  }
  while (cursor < beats - 1e-9) {
    const meta = locateGroup(cursor, groups);
    slots.push({
      systemIndex: system.index,
      barIndex,
      beatIndex: cursor,
      x: x0 + cursor * beatPx,
      y,
      width: beatPx,
      height,
      ...meta,
    });
    cursor += 1;
  }
  return slots;
}

export function findSlotAt(
  slots: readonly BeatSlotRect[],
  x: number,
  y: number,
): BeatSlotRect | null {
  for (const s of slots) {
    if (x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height) return s;
  }
  return null;
}

// 메인박(그룹) 단위로 슬롯들을 묶은 union rect. 시각 표현용이며, hit/hover/blink는 여전히
// 슬롯(작은박) 단위라 멤버 슬롯 배열을 함께 보존한다.
export interface GroupedSlotRect {
  systemIndex: number;
  barIndex: number;
  groupIndex: number;
  /** 그룹 union의 좌측 x. 그룹의 첫 슬롯과 동일. */
  x: number;
  y: number;
  /** 그룹 첫 슬롯의 x ~ 마지막 슬롯의 우측까지의 합산 폭. */
  width: number;
  height: number;
  /** 그룹에 속한 작은박 슬롯들. 작은박 분할 점선 등 내부 시각화에 사용. */
  members: readonly BeatSlotRect[];
}

// 슬롯 시퀀스를 같은 (systemIndex, barIndex, groupIndex)끼리 묶어 union rect로 환산.
// calculateBeatSlots 결과는 마디 내부에서 이미 row-major 순서이므로 in-place 그룹 단위로
// 잘라내면 된다 — 다른 마디/시스템 슬롯이 끼어들지 않는다.
export function groupBeatSlots(slots: readonly BeatSlotRect[]): GroupedSlotRect[] {
  const out: GroupedSlotRect[] = [];
  let i = 0;
  while (i < slots.length) {
    const head = slots[i]!;
    let j = i + 1;
    while (
      j < slots.length &&
      slots[j]!.systemIndex === head.systemIndex &&
      slots[j]!.barIndex === head.barIndex &&
      slots[j]!.groupIndex === head.groupIndex
    ) {
      j++;
    }
    const last = slots[j - 1]!;
    const members = slots.slice(i, j);
    out.push({
      systemIndex: head.systemIndex,
      barIndex: head.barIndex,
      groupIndex: head.groupIndex,
      x: head.x,
      y: head.y,
      width: last.x + last.width - head.x,
      height: head.height,
      members,
    });
    i = j;
  }
  return out;
}
