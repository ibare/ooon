import type { ScoreLayout, ScoreBarLayout, ScoreSystemLayout } from '@oon/score-engraving';
import type { ScoreNode } from '@oon/core';

export interface BeatSlotRect {
  systemIndex: number;
  barIndex: number; // ScoreNode.bars 내 인덱스 (0-based)
  beatIndex: number; // 마디 내 박자 인덱스
  x: number;
  y: number;
  width: number;
  height: number;
}

// 마디가 비었을 때만 박자 슬롯을 노출한다(채워진 마디는 노트로 표현되므로 슬롯 불필요).
// width는 (bar.width - 좌우 inner pad)를 박자 수로 균등 분할. 모든 마디는 같은 박자 수.
export function calculateBeatSlots(
  layout: ScoreLayout,
  node: ScoreNode,
): BeatSlotRect[] {
  const beatsPerBar = node.timeSignature.beats;
  if (beatsPerBar <= 0) return [];

  const result: BeatSlotRect[] = [];
  for (const system of layout.systems) {
    for (const bar of system.bars) {
      const barIdx = bar.barNumber - 1;
      const sourceBar = node.bars[barIdx];
      if (!sourceBar) continue;
      if (sourceBar.notes.length > 0) continue;
      result.push(...slotsForBar(system, bar, barIdx, beatsPerBar));
    }
  }
  return result;
}

function slotsForBar(
  system: ScoreSystemLayout,
  bar: ScoreBarLayout,
  barIndex: number,
  beats: number,
): BeatSlotRect[] {
  const innerPad = system.staff.lineGap * 0.6;
  const x0 = bar.x + innerPad;
  const x1 = bar.barlineX - innerPad;
  const usable = Math.max(0, x1 - x0);
  const slotWidth = usable / beats;
  const y = system.staff.top;
  const height = system.staff.bottom - system.staff.top;
  const slots: BeatSlotRect[] = [];
  for (let b = 0; b < beats; b++) {
    slots.push({
      systemIndex: system.index,
      barIndex,
      beatIndex: b,
      x: x0 + b * slotWidth,
      y,
      width: slotWidth,
      height,
    });
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
