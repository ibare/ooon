import type { TimeSignature } from '../ast/types.js';

// 박자별 음악적 메인박 그룹.
//
// 시스템의 "1박"(= 1/beatValue whole note)과 음악의 metric beat는 다른 층이다.
// 예) 6/8: 시스템 1박 = 8분음표(작은박 6개)지만 음악적으로는 점4분 단위 2박으로 느껴진다.
// 그룹 배열은 작은박을 메인박 단위로 어떻게 묶는지를 표현한다. 각 원소의 합은 ts.beats와 같다.
//
// 입력 정밀도(작은박 단위)는 손대지 않고 시각/UX 그룹핑 힌트로만 쓰인다.
// 카탈로그에 없는 비표준 박자는 단일 그룹([beats])으로 fallback — 모든 슬롯이 동일 시각 단위.
//
// CATALOG는 시스템에서 지원되는 박자의 단일 진실 원천. picker 등 노출 layer는 여기서 derive한다
// (`SUPPORTED_TIME_SIGNATURES`). 분모순(2 → 4 → 8)으로 정렬되어 그대로 UI 후보 순서로 쓰인다.
const CATALOG: ReadonlyArray<{
  beats: number;
  beatValue: number;
  groups: readonly number[];
}> = [
  // 분모 2 — cut time
  { beats: 2, beatValue: 2, groups: [2] },
  // 분모 4 — 단순 박자 + 비대칭
  { beats: 2, beatValue: 4, groups: [2] },
  { beats: 3, beatValue: 4, groups: [3] },
  { beats: 4, beatValue: 4, groups: [4] },
  { beats: 5, beatValue: 4, groups: [3, 2] },
  // 분모 8 — 단순/컴파운드/비대칭
  { beats: 3, beatValue: 8, groups: [3] },
  { beats: 6, beatValue: 8, groups: [3, 3] },
  { beats: 7, beatValue: 8, groups: [2, 2, 3] },
  { beats: 9, beatValue: 8, groups: [3, 3, 3] },
  { beats: 12, beatValue: 8, groups: [3, 3, 3, 3] },
];

export function getBeatGroups(ts: TimeSignature): number[] {
  const hit = CATALOG.find((e) => e.beats === ts.beats && e.beatValue === ts.beatValue);
  if (hit) return [...hit.groups];
  return [ts.beats];
}

// 시스템에서 지원되는 박자 목록(분모순). picker 등 노출 layer가 derive해서 사용한다.
// CATALOG와 자동으로 동기화되므로 박자 추가는 위 CATALOG 한 곳만 수정하면 된다.
export const SUPPORTED_TIME_SIGNATURES: readonly TimeSignature[] = CATALOG.map((e) => ({
  beats: e.beats,
  beatValue: e.beatValue,
}));

// 복합 박자(compound meter): 분모가 8 이상이고 작은박이 3개 단위로 그룹핑되는 박자.
// 6/8, 9/8, 12/8이 대표. 7/8(2-2-3) 같은 비대칭은 단순도 복합도 아니므로 false.
// 분류 기준: 그룹이 모두 3이고 길이 ≥ 1이며 분모가 8 이상.
// CATALOG의 groups를 단일 진실 원천으로 사용 — 박자 추가 시 자동 반영.
export function isCompoundMeter(ts: TimeSignature): boolean {
  const hit = CATALOG.find((e) => e.beats === ts.beats && e.beatValue === ts.beatValue);
  if (!hit) return false;
  if (ts.beatValue < 8) return false;
  return hit.groups.length >= 1 && hit.groups.every((g) => g === 3);
}
