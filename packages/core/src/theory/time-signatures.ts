import type { TimeSignature } from '../ast/types.js';

// 박자별 음악적 메인박 그룹.
//
// 시스템의 "1박"(= 1/beatValue whole note)과 음악의 metric beat는 다른 층이다.
// 예) 6/8: 시스템 1박 = 8분음표(작은박 6개)지만 음악적으로는 점4분 단위 2박으로 느껴진다.
// 그룹 배열은 작은박을 메인박 단위로 어떻게 묶는지를 표현한다. 각 원소의 합은 ts.beats와 같다.
//
// 입력 정밀도(작은박 단위)는 손대지 않고 시각/UX 그룹핑 힌트로만 쓰인다.
// 카탈로그에 없는 비표준 박자는 단일 그룹([beats])으로 fallback — 모든 슬롯이 동일 시각 단위.
const CATALOG: ReadonlyArray<{
  beats: number;
  beatValue: number;
  groups: readonly number[];
}> = [
  // 단순 박자(분모 4)
  { beats: 2, beatValue: 4, groups: [2] },
  { beats: 3, beatValue: 4, groups: [3] },
  { beats: 4, beatValue: 4, groups: [4] },
  // cut time
  { beats: 2, beatValue: 2, groups: [2] },
  // 컴파운드(분모 8) — 3박씩 묶음
  { beats: 3, beatValue: 8, groups: [3] },
  { beats: 6, beatValue: 8, groups: [3, 3] },
  { beats: 9, beatValue: 8, groups: [3, 3, 3] },
  { beats: 12, beatValue: 8, groups: [3, 3, 3, 3] },
  // 비대칭 — 관습적 그룹핑(향후 사용자 override 도입 시 변경 가능)
  { beats: 5, beatValue: 4, groups: [3, 2] },
  { beats: 7, beatValue: 8, groups: [2, 2, 3] },
];

export function getBeatGroups(ts: TimeSignature): number[] {
  const hit = CATALOG.find((e) => e.beats === ts.beats && e.beatValue === ts.beatValue);
  if (hit) return [...hit.groups];
  return [ts.beats];
}
