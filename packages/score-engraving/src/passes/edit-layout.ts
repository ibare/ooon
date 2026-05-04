// ─────────────────────────────────────────────────────────────────────────────
// 편집 모드 레이아웃 정책.
//
// 1순위: 슬롯 클릭 임계(=range.min) 확보. 한 마디가 더 좁아지면 박자 슬롯이
//        손가락 임계(약 40~50px) 아래로 떨어져 편집이 사실상 불가능하다.
// 2순위: 음악 조판 미관(자연 폭/상한 max).
//
// 결정 절차:
//   nMax = floor(availableContent / range.min)            ← 클릭 임계 기준 한 줄 최대
//   barCount ≤ nMax: 단일 시스템, 자연 폭 좌측 정렬       ← 자연 폭이 컨테이너를
//                                                            넘으면 편집 영역 확보를 위해
//                                                            그대로 둔다(렌더 모드와 다름).
//   barCount > nMax: 다중 시스템, barWidth = clamp(avail/nMax, ≤ range.max)
// ─────────────────────────────────────────────────────────────────────────────

import {
  emptyLayoutPlan,
  maxBarsByMinWidth,
  type ChooseLayoutArgs,
  type UniformLayoutPlan,
} from './bar-width.js';

export function chooseEditLayout(args: ChooseLayoutArgs): UniformLayoutPlan {
  const { barCount, range, availableContent } = args;
  if (barCount <= 0) return emptyLayoutPlan(range.natural);

  const nMax = maxBarsByMinWidth(range, availableContent);

  if (barCount <= nMax) {
    // 단일 시스템 — 자연 폭 좌측 정렬. 자연 폭 합이 컨테이너를 초과해도 그대로 둔다.
    // 편집 모드는 컨테이너 정합보다 슬롯 클릭 임계 확보가 우선이라, 호출 측이 컨테이너를
    // 키우거나 줌 아웃하는 식으로 대응한다.
    return { barsPerSystem: barCount, systemCount: 1, barWidth: range.natural };
  }

  // 다중 시스템 — 모든 마디 동일 폭. 균등 분배가 max를 넘으면 max 클램프
  // (가득 찬 줄에 우측 여백 발생, 마디가 너무 늘어지지 않도록).
  const barWidth = Math.min(range.max, availableContent / nMax);
  return {
    barsPerSystem: nMax,
    systemCount: Math.ceil(barCount / nMax),
    barWidth,
  };
}
