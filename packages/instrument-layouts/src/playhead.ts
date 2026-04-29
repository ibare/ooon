import type { DrumLayout, ProgressionLayout } from './types.js';

/**
 * 곡 시작부터 누적 beat를 받아 drum row의 x좌표를 산출.
 * - layout.barDividers는 길이 barCount+1, [i].x는 i번째 마디 시작 x.
 * - 곡 범위 밖 beat는 곡 시작/끝으로 클램프.
 */
export function getDrumPlayheadX(
  layout: DrumLayout,
  beat: number,
  beatsPerBar: number,
): number {
  if (layout.barDividers.length === 0) return 0;
  const first = layout.barDividers[0]!;
  if (layout.barDividers.length === 1) return first.x;

  const barWidth = layout.barDividers[1]!.x - first.x;
  const barCount = layout.barDividers.length - 1;
  const totalBeats = barCount * beatsPerBar;
  const clamped = Math.max(0, Math.min(totalBeats, beat));
  const barIdx = Math.min(barCount - 1, Math.floor(clamped / beatsPerBar));
  const beatInBar = clamped - barIdx * beatsPerBar;
  return first.x + (barIdx + beatInBar / beatsPerBar) * barWidth;
}

/**
 * 곡 시작부터 누적 beat를 받아 progression row(카드 배열) 안에서 x좌표를 산출.
 * - 카드 1장 = 1마디. 카드 안에서는 (beatInBar/beatsPerBar)로 균등 보간.
 * - 카드 사이의 gap은 무시한다(playhead는 카드 끝 → 다음 카드 시작으로 점프).
 */
export function getProgressionPlayheadX(
  layout: ProgressionLayout,
  beat: number,
  beatsPerBar: number,
): number {
  if (layout.cards.length === 0) return 0;
  const barCount = layout.cards.length;
  const totalBeats = barCount * beatsPerBar;
  const clamped = Math.max(0, Math.min(totalBeats, beat));
  const barIdx = Math.min(barCount - 1, Math.floor(clamped / beatsPerBar));
  const card = layout.cards[barIdx]!;
  const beatInBar = clamped - barIdx * beatsPerBar;
  const t = beatInBar / beatsPerBar;
  return card.rect.x + t * card.rect.width;
}
