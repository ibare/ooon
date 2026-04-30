import type { ScoreLayout, ScoreBarLayout, ScoreSystemLayout } from '@oon/score-engraving';
import type { ScoreNode } from '@oon/core';

export interface BeatSlotRect {
  systemIndex: number;
  barIndex: number; // ScoreNode.bars 내 인덱스 (0-based)
  beatIndex: number; // 슬롯이 시작하는 박자 위치(0-based, 정수 또는 분수)
  x: number;
  y: number;
  width: number;
  height: number;
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

  const result: BeatSlotRect[] = [];
  for (const system of layout.systems) {
    for (const bar of system.bars) {
      const barIdx = bar.barNumber - 1;
      const sourceBar = node.bars[barIdx];
      if (!sourceBar) continue;
      const usedBeats = sourceBar.notes.reduce((sum, n) => sum + n.beats, 0);
      if (usedBeats >= beatsPerBar - 1e-9) continue;
      result.push(...slotsForBar(system, bar, barIdx, beatsPerBar, usedBeats));
    }
  }
  return result;
}

function slotsForBar(
  system: ScoreSystemLayout,
  bar: ScoreBarLayout,
  barIndex: number,
  beats: number,
  usedBeats: number,
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
    slots.push({
      systemIndex: system.index,
      barIndex,
      beatIndex: cursor,
      x: x0 + cursor * beatPx,
      y,
      width: slotBeats * beatPx,
      height,
    });
    cursor = nextInt;
  }
  while (cursor < beats - 1e-9) {
    slots.push({
      systemIndex: system.index,
      barIndex,
      beatIndex: cursor,
      x: x0 + cursor * beatPx,
      y,
      width: beatPx,
      height,
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
