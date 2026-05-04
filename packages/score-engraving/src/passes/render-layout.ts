// ─────────────────────────────────────────────────────────────────────────────
// 렌더 전용 레이아웃 정책.
//
// 1순위: 컨테이너 정합. 한 줄의 폭 합이 항상 availableContent 이내라 잘림이 없다.
// 2순위: 자연 폭(range.natural)을 상한 — 컨테이너가 매우 넓어도 한 마디가 자연 폭보다
//        커지지 않게 해 미관(가로로 늘어진 마디) 보존.
// 편집 임계(range.max 클램프)는 렌더에서 의미가 없어 사용하지 않는다.
//
// 결정 절차:
//   nMax = floor(availableContent / range.min)            ← 한 마디 최소 가독 폭 기준 wrap
//   barsPerSystem = min(barCount, nMax)
//   barWidth      = min(range.natural, availableContent / barsPerSystem)
//   systemCount   = ceil(barCount / barsPerSystem)
//
// 결과: 자연 폭으로 다 들어가면 단일 시스템 좌측 정렬, 자연 폭이 컨테이너를 넘으면
// 균등 폭으로 자동 축소. 마디 수가 많아 wrap이 발생하면 동일 폭 그리드 정렬.
// ─────────────────────────────────────────────────────────────────────────────

import {
  emptyLayoutPlan,
  fitBarWidth,
  maxBarsByMinWidth,
  type ChooseLayoutArgs,
  type UniformLayoutPlan,
} from './bar-width.js';

export function chooseRenderLayout(args: ChooseLayoutArgs): UniformLayoutPlan {
  const { barCount, range, availableContent } = args;
  if (barCount <= 0) return emptyLayoutPlan(range.natural);

  const nMax = maxBarsByMinWidth(range, availableContent);
  const barsPerSystem = Math.min(barCount, nMax);
  const barWidth = fitBarWidth(range, availableContent, barsPerSystem);
  const systemCount = Math.ceil(barCount / barsPerSystem);

  return { barsPerSystem, systemCount, barWidth };
}
