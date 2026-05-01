import type { ScoreLayout } from '@oon/score-engraving';

// 박자표 클릭 영역. system 마다 박자표가 반복되므로 system 별로 한 개씩.
// 가로 폭은 layout이 contentStart로 표기한 위치(= timeSig 직후)까지로 잡는다.
// 세로는 staff 전체(top~bottom)로 — 분자/분모 글리프가 staff 안쪽에 배치되어 있음.
export interface TimeSigHitRect {
  systemIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function calculateTimeSigHits(layout: ScoreLayout): TimeSigHitRect[] {
  const out: TimeSigHitRect[] = [];
  for (const system of layout.systems) {
    const x = system.timeSig.x;
    const width = Math.max(0, system.contentStart - x);
    const y = system.staff.top;
    const height = system.staff.bottom - system.staff.top;
    out.push({ systemIndex: system.index, x, y, width, height });
  }
  return out;
}

export function findTimeSigHitAt(
  hits: readonly TimeSigHitRect[],
  x: number,
  y: number,
): TimeSigHitRect | null {
  for (const h of hits) {
    if (x >= h.x && x <= h.x + h.width && y >= h.y && y <= h.y + h.height) return h;
  }
  return null;
}
