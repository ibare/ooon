import type { ScoreLayout } from './types.js';

export interface ScorePlayheadPosition {
  systemIndex: number;
  x: number;
  y: number;
  height: number;
}

/**
 * 곡 시작부터 누적된 beat(timeSignature 기반) 위치를 받아
 * 해당 beat가 속한 system의 좌표를 반환한다.
 *
 * - layout.systems가 비어 있으면 null.
 * - beat가 곡 범위 이전이면 첫 시스템 첫 마디 시작에 클램프.
 * - beat가 곡 범위 이후이면 마지막 시스템 마지막 마디 끝에 클램프.
 */
export function getScorePlayhead(
  layout: ScoreLayout,
  beat: number,
  beatsPerBar: number,
): ScorePlayheadPosition | null {
  if (layout.systems.length === 0) return null;

  const targetBarNumber = Math.floor(beat / beatsPerBar) + 1; // bar.barNumber는 1-based

  for (let si = 0; si < layout.systems.length; si += 1) {
    const sys = layout.systems[si]!;
    if (sys.bars.length === 0) continue;
    const first = sys.bars[0]!.barNumber;
    const last = sys.bars[sys.bars.length - 1]!.barNumber;

    if (targetBarNumber < first) {
      const bar = sys.bars[0]!;
      return { systemIndex: si, x: bar.x, y: sys.y, height: sys.height };
    }
    if (targetBarNumber > last) continue;

    const bar = sys.bars[targetBarNumber - first]!;
    const beatInBar = beat - (targetBarNumber - 1) * beatsPerBar;
    const t = Math.max(0, Math.min(1, beatInBar / beatsPerBar));
    return { systemIndex: si, x: bar.x + t * bar.width, y: sys.y, height: sys.height };
  }

  for (let si = layout.systems.length - 1; si >= 0; si -= 1) {
    const sys = layout.systems[si]!;
    if (sys.bars.length === 0) continue;
    const lastBar = sys.bars[sys.bars.length - 1]!;
    return { systemIndex: si, x: lastBar.x + lastBar.width, y: sys.y, height: sys.height };
  }
  return null;
}
