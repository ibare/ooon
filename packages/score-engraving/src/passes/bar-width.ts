// ─────────────────────────────────────────────────────────────────────────────
// 박자별 마디 폭 범위 + 레이아웃 정책 공통 모듈.
//
// 정책은 두 갈래로 분리되어 있다:
//   - chooseEditLayout (./edit-layout.ts) — 편집 모드. 슬롯 클릭 임계 우선.
//   - chooseRenderLayout (./render-layout.ts) — 렌더 모드. 컨테이너 정합 + 자연 폭 상한.
//
// 이 파일은 두 정책이 공유하는 임계 상수, 폭 범위 산출, 공통 헬퍼만 둔다.
// 정책 본체(분기/임계 조합)는 각 정책 파일에서 결정한다.
// ─────────────────────────────────────────────────────────────────────────────

import type { TimeSignature } from '@ooon/core';

// 박자 슬롯당 sp 임계 — 편집 UX의 클릭 임계와 음악 조판 미관의 균형.
// pxPerSp=10일 때 50/70/120px. 손가락 클릭 임계(약 40~50px) 충족.
//   - min: "한 마디가 더 좁아지면 안 되는 하한". 편집에선 슬롯 클릭 임계, 렌더에선 가독 하한.
//   - natural: 자연 폭. 단일 시스템(여유 있는 컨테이너) 또는 렌더 모드의 상한으로 사용.
//   - max: 마디가 너무 늘어지지 않도록 두는 상한(편집 정책에서만 사용).
export const BAR_MIN_BEAT_SLOT_SP = 5;
export const BAR_NATURAL_BEAT_SLOT_SP = 7;
export const BAR_MAX_BEAT_SLOT_SP = 12;

export interface BarWidthRange {
  /** 한 마디가 더 좁아지면 안 되는 하한(px). 편집에선 슬롯 클릭 임계, 렌더에선 가독 하한. */
  min: number;
  /** 자연 폭(px). 단일 시스템 좌측 정렬용 또는 렌더 모드의 폭 상한. */
  natural: number;
  /** 마디 늘어짐 상한(px). 편집 정책의 다중 시스템에서 균등 분배가 max를 넘으면 클램프. */
  max: number;
}

export function barWidthRange(
  timeSignature: TimeSignature,
  pxPerSp: number,
  innerPadPx: number,
): BarWidthRange {
  const beats = Math.max(1, timeSignature.beats);
  const pad = innerPadPx * 2;
  return {
    min: beats * BAR_MIN_BEAT_SLOT_SP * pxPerSp + pad,
    natural: beats * BAR_NATURAL_BEAT_SLOT_SP * pxPerSp + pad,
    max: beats * BAR_MAX_BEAT_SLOT_SP * pxPerSp + pad,
  };
}

export interface UniformLayoutPlan {
  /** 한 줄(시스템)에 들어갈 마디 수. 마지막 줄은 1~N개 가능. */
  barsPerSystem: number;
  /** 시스템 총 수. ceil(barCount / barsPerSystem). barCount=0이면 0. */
  systemCount: number;
  /** 모든 시스템의 모든 마디에 적용되는 동일 마디 폭(px). */
  barWidth: number;
}

export interface ChooseLayoutArgs {
  /** 전체 마디 수. 0이면 placeholder plan(systemCount=0)을 반환한다. */
  barCount: number;
  /** 박자별 폭 범위. */
  range: BarWidthRange;
  /** prefix(clef+keySig+timeSig)와 우측 마진을 뺀, 마디 영역에 쓸 수 있는 폭(px). */
  availableContent: number;
}

// 두 정책이 공유하는 wrap 임계 — "한 마디 최소 폭"을 넘지 않는 범위에서 한 줄 최대 마디 수.
// 편집에선 손가락 클릭 임계, 렌더에선 가독 하한이라는 두 의미를 같은 min에 일반화해 묶었다.
// 향후 정책별로 임계가 달라져야 하면 이 헬퍼를 두 함수로 분리한다.
export function maxBarsByMinWidth(range: BarWidthRange, availableContent: number): number {
  return Math.max(1, Math.floor(availableContent / range.min));
}

// 자연 폭 상한 + 컨테이너 균등 축소를 동시에 만족하는 마디 폭 산출.
// 렌더 정책(chooseRenderLayout)과 wrap='none' 분기가 공유하는 식 — 한 줄 마디 수가 정해진
// 상황에서 "자연 폭이 컨테이너에 들어가면 자연 폭 그대로, 넘으면 컨테이너에 맞춰 축소"한다.
export function fitBarWidth(
  range: BarWidthRange,
  availableContent: number,
  barsPerSystem: number,
): number {
  const n = Math.max(1, barsPerSystem);
  return Math.min(range.natural, availableContent / n);
}

// barCount=0 placeholder plan. 빈 score(헤더만 있는 경우) 호환을 위해 단일 시스템 자리만 잡는다.
// systemCount=0이라 호출 측은 시스템을 그리지 않지만, barWidth 필드는 0으로 두지 않고 자연 폭을
// 넣어 두어 후속 계산이 0 나누기를 만나지 않도록 한다.
export function emptyLayoutPlan(naturalWidth: number): UniformLayoutPlan {
  return { barsPerSystem: 1, systemCount: 0, barWidth: naturalWidth };
}
