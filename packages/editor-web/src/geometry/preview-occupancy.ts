import type { ScoreLayout } from '@ooon/score-engraving';

export interface PreviewOccupancyRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// picker hover 시 그 옵션이 점유할 박자 영역의 픽셀 사각형 산출.
// (barIndex, startBeat, beats)를 받아 staff top~bottom 높이 + 시작 박자~끝 박자 폭으로 환산.
//
// calculateBeatSlots(geometry/beat-overlay.ts)와 동일한 좌표식을 사용해야 박자 슬롯 위에 정확히
// 정합된다: innerPad = staff.lineGap × 0.6, beatPx = (barlineX - x0 - innerPad×2) / beatsPerBar.
//
// startBeat + beats가 마디 총 박자를 넘는 경우는 picker가 옵션 단계에서 이미 걸러내므로(remain
// 초과 옵션 미노출) 고려하지 않는다. layout/마디 매칭 실패 시 null을 반환해 호출자가 그리지 않게.
export function previewOccupancyRect(
  layout: ScoreLayout,
  barIndex: number,
  startBeat: number,
  beats: number,
  beatsPerBar: number,
): PreviewOccupancyRect | null {
  if (beatsPerBar <= 0 || beats <= 0) return null;
  for (const system of layout.systems) {
    for (const bar of system.bars) {
      if (bar.barNumber - 1 !== barIndex) continue;
      const innerPad = system.staff.lineGap * 0.6;
      const x0 = bar.x + innerPad;
      const x1 = bar.barlineX - innerPad;
      const usable = Math.max(0, x1 - x0);
      const beatPx = usable / beatsPerBar;
      const y = system.staff.top;
      const height = system.staff.bottom - system.staff.top;
      return {
        x: x0 + startBeat * beatPx,
        y,
        width: beats * beatPx,
        height,
      };
    }
  }
  return null;
}
