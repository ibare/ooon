import type { ScoreLayout, ScoreBarLayout, ScoreSystemLayout } from '@oon/score-engraving';
import { getBeatGroups, type ScoreNode } from '@oon/core';
import { SLOT_HIT_LEDGER_LINES } from '../constants.js';

export interface BeatSlotRect {
  systemIndex: number;
  barIndex: number; // ScoreNode.bars 내 인덱스 (0-based)
  beatIndex: number; // 슬롯이 시작하는 박자 위치(0-based, 정수 또는 분수)
  x: number;
  y: number;
  width: number;
  height: number;
  /** hit 전용 상단 y. 시각(y/height)보다 위로 SLOT_HIT_LEDGER_LINES * lineGap 만큼 확장 —
   *  마우스가 오선 위 ledger 영역에 있어도 슬롯 hit이 잡혀 ghost preview가 동작. */
  hitTop: number;
  /** hit 전용 하단 y. 시각(y+height)보다 아래로 SLOT_HIT_LEDGER_LINES * lineGap 만큼 확장. */
  hitBottom: number;
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
  const hitExtension = system.staff.lineGap * SLOT_HIT_LEDGER_LINES;
  const hitTop = system.staff.top - hitExtension;
  const hitBottom = system.staff.bottom + hitExtension;
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
      hitTop,
      hitBottom,
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
      hitTop,
      hitBottom,
      ...meta,
    });
    cursor += 1;
  }
  return slots;
}

// hit-test는 시각 영역(staff 안쪽)이 아닌 hitTop/hitBottom 확장 영역을 기준으로 한다.
// 마우스가 ledger 영역(staff 위/아래)에 있어도 슬롯이 잡혀 ghost preview의 pitch를 자유롭게
// 결정할 수 있다.
export function findSlotAt(
  slots: readonly BeatSlotRect[],
  x: number,
  y: number,
): BeatSlotRect | null {
  for (const s of slots) {
    if (x >= s.x && x <= s.x + s.width && y >= s.hitTop && y <= s.hitBottom) return s;
  }
  return null;
}

// 모델은 `insertNote`가 항상 마디 끝(=첫 빈 슬롯)에 append한다. 빈 슬롯이 여러 개여도
// 어느 슬롯을 클릭하든 결과 위치는 동일하므로, 인터랙션은 마디별 "첫 빈 슬롯"만 활성화한다.
// 시각(오버레이)은 모든 빈 슬롯을 동일하게 그리되 hover/click이 무반응일 뿐 — 사용자가
// 클릭한 위치와 실제 추가 위치가 어긋나는 misleading UX를 차단.
//
// `calculateBeatSlots`는 마디 내부에서 row-major 순서로 슬롯을 산출하므로 같은 barIndex의
// 첫 등장만 보존하면 곧 첫 빈 슬롯이다(한 마디는 한 시스템에 속하므로 systemIndex는 불필요).
export function firstEmptySlotPerBar(slots: readonly BeatSlotRect[]): BeatSlotRect[] {
  const out: BeatSlotRect[] = [];
  const seen = new Set<number>();
  for (const s of slots) {
    if (seen.has(s.barIndex)) continue;
    seen.add(s.barIndex);
    out.push(s);
  }
  return out;
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
