// ─────────────────────────────────────────────────────────────────────────────
// 박자별 마디 폭 범위 + uniform grid wrap 결정.
//
// 정책 (사용자 합의):
//   - 줄바꿈이 한 번이라도 발생하면 그 score의 모든 마디는 같은 폭(uniformBarWidth)을
//     갖는다. 마지막 줄(1~N개 마디)도 같은 폭으로 그려, 모든 줄의 i번째 마디가
//     수직으로 같은 x를 가진다(grid 정렬).
//   - 줄바꿈이 없으면(전체가 한 줄) 자연 폭(naturalBarWidth)으로 좌측 정렬,
//     컨테이너를 가득 채우지 않는다(마디 1·2개 케이스가 어색하지 않도록).
//
// 폭 도출:
//   - 박자 슬롯당 최소/자연/최대 sp 임계를 정의하고
//     barWidth = beatsPerBar × slotSp × pxPerSp + 2 × innerPadPx
//     로 환산. 박자가 늘어나면(예: 12/8) 마디 폭도 비례해 커진다.
//
// wrap N 결정:
//   - N = floor(availableContent / range.min) (최소 폭으로 한 줄에 들어갈 수 있는 최대치)
//   - barCount ≤ N: 단일 시스템, mode='natural', barWidth = range.natural
//   - barCount  > N: 다중 시스템, mode='uniform',
//                    barWidth = clamp(availableContent / N, [range.natural, range.max])
//                    (균등 분배가 max를 넘으면 max 클램프 → 가득 찬 줄에 우측 여백 생김)
// ─────────────────────────────────────────────────────────────────────────────

import type { TimeSignature } from '@oon/core';

// 박자 슬롯당 sp 임계 — 편집 UX의 클릭 임계와 음악 조판 미관의 균형.
// pxPerSp=10일 때 50/70/120px. 손가락 클릭 임계(약 40~50px) 충족.
export const BAR_MIN_BEAT_SLOT_SP = 5;
export const BAR_NATURAL_BEAT_SLOT_SP = 7;
export const BAR_MAX_BEAT_SLOT_SP = 12;

export interface BarWidthRange {
  /** 편집 임계를 만족하는 마디의 최소 폭(px). 이 미만이면 박자 슬롯 클릭이 사람 손가락 임계 아래로 떨어진다. */
  min: number;
  /** 자연 폭(px). 단일 시스템(줄바꿈 없음)에서 사용. */
  natural: number;
  /** 마디가 너무 늘어지지 않도록 두는 상한(px). 가득 찬 줄에서 균등 분배가 max를 넘으면 우측 여백을 둔다. */
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

export type UniformLayoutMode = 'natural' | 'uniform';

export interface UniformLayoutPlan {
  /** 한 줄(시스템)에 들어갈 마디 수. 마지막 줄은 1~N개 가능. */
  barsPerSystem: number;
  /** 시스템 총 수. ceil(barCount / barsPerSystem). barCount=0이면 0. */
  systemCount: number;
  /** 모든 시스템의 모든 마디에 적용되는 동일 마디 폭(px). */
  barWidth: number;
  /** 'natural' = 단일 시스템 자연 폭 좌측 정렬, 'uniform' = 다중 시스템 균등 폭 그리드. */
  mode: UniformLayoutMode;
}

export interface ChooseUniformLayoutArgs {
  /** 전체 마디 수. 0이면 systemCount=0 반환. */
  barCount: number;
  /** 박자별 폭 범위. */
  range: BarWidthRange;
  /** prefix(clef+keySig+timeSig)와 우측 마진을 뺀, 마디 영역에 쓸 수 있는 폭(px). */
  availableContent: number;
}

export function chooseUniformLayout(args: ChooseUniformLayoutArgs): UniformLayoutPlan {
  const { barCount, range, availableContent } = args;
  if (barCount <= 0) {
    return { barsPerSystem: 1, systemCount: 0, barWidth: range.natural, mode: 'natural' };
  }

  // N: 박자별 최소 폭으로 한 줄에 들어갈 수 있는 최대 마디 수. 최소 1.
  const nMax = Math.max(1, Math.floor(availableContent / range.min));

  if (barCount <= nMax) {
    // 단일 시스템 — 자연 폭 좌측 정렬.
    return {
      barsPerSystem: barCount,
      systemCount: 1,
      barWidth: range.natural,
      mode: 'natural',
    };
  }

  // 다중 시스템 — 모든 마디 동일 폭. 균등 분배가 max를 넘으면 max 클램프.
  // (clamp 하한은 range.natural로 두지 않는다 — N 결정이 이미 min ≤ width 보장. natural보다
  //  좁아져도 편집 임계는 만족하며, 가득 찬 컨테이너 미관이 우선.)
  const naive = availableContent / nMax;
  const barWidth = Math.min(range.max, naive);

  return {
    barsPerSystem: nMax,
    systemCount: Math.ceil(barCount / nMax),
    barWidth,
    mode: 'uniform',
  };
}
