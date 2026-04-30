import type { ScoreLayout } from '@oon/score-engraving';
import { PLUCK_ZONE_GAP_FROM_BARLINE, PLUCK_ZONE_WIDTH } from '../constants.js';

export interface PluckZoneRect {
  systemIndex: number;
  /** 마지막 마디의 인덱스(ScoreNode.bars 기준) */
  lastBarIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  /** 보표 line/space 스냅용 */
  staffTop: number;
  staffBottom: number;
  staffLineGap: number;
}

// 각 system의 마지막 bar 오른쪽 barline 너머에 직사각형 zone을 둔다.
// 마지막 마디가 가득 차 있을 때만 의미가 있도록 제한할 수도 있으나,
// 일단 모든 system에 노출해 다음 음표 추가의 시각 단서를 제공한다.
export function calculatePluckZones(layout: ScoreLayout): PluckZoneRect[] {
  const zones: PluckZoneRect[] = [];
  for (const system of layout.systems) {
    const lastBar = system.bars[system.bars.length - 1];
    if (!lastBar) continue;
    const x = lastBar.barlineX + PLUCK_ZONE_GAP_FROM_BARLINE;
    zones.push({
      systemIndex: system.index,
      lastBarIndex: lastBar.barNumber - 1,
      x,
      y: system.staff.top,
      width: PLUCK_ZONE_WIDTH,
      height: system.staff.bottom - system.staff.top,
      staffTop: system.staff.top,
      staffBottom: system.staff.bottom,
      staffLineGap: system.staff.lineGap,
    });
  }
  return zones;
}

export function findZoneAt(
  zones: readonly PluckZoneRect[],
  x: number,
  y: number,
): PluckZoneRect | null {
  for (const z of zones) {
    if (x >= z.x && x <= z.x + z.width && y >= z.y - z.staffLineGap * 4 && y <= z.y + z.height + z.staffLineGap * 4) {
      return z;
    }
  }
  return null;
}
