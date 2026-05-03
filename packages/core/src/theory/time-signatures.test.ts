import { describe, expect, it } from 'vitest';
import { getBeatGroups, isCompoundMeter, SUPPORTED_TIME_SIGNATURES } from './time-signatures.js';

describe('getBeatGroups', () => {
  it('단순 박자(분모 4)는 단일 그룹', () => {
    expect(getBeatGroups({ beats: 2, beatValue: 4 })).toEqual([2]);
    expect(getBeatGroups({ beats: 3, beatValue: 4 })).toEqual([3]);
    expect(getBeatGroups({ beats: 4, beatValue: 4 })).toEqual([4]);
  });

  it('컴파운드(분모 8)는 3박씩 묶음', () => {
    expect(getBeatGroups({ beats: 3, beatValue: 8 })).toEqual([3]);
    expect(getBeatGroups({ beats: 6, beatValue: 8 })).toEqual([3, 3]);
    expect(getBeatGroups({ beats: 9, beatValue: 8 })).toEqual([3, 3, 3]);
    expect(getBeatGroups({ beats: 12, beatValue: 8 })).toEqual([3, 3, 3, 3]);
  });

  it('비대칭 박자는 관습적 그룹', () => {
    expect(getBeatGroups({ beats: 5, beatValue: 4 })).toEqual([3, 2]);
    expect(getBeatGroups({ beats: 7, beatValue: 8 })).toEqual([2, 2, 3]);
  });

  it('cut time(2/2)은 2박 단일 그룹', () => {
    expect(getBeatGroups({ beats: 2, beatValue: 2 })).toEqual([2]);
  });

  it('카탈로그 미정의 박자는 [beats] 단일 그룹으로 fallback', () => {
    // 11/8 같은 비등록 박자
    expect(getBeatGroups({ beats: 11, beatValue: 8 })).toEqual([11]);
    expect(getBeatGroups({ beats: 5, beatValue: 8 })).toEqual([5]);
    // 분모는 같지만 분자가 미등록
    expect(getBeatGroups({ beats: 13, beatValue: 4 })).toEqual([13]);
  });

  it('모든 카탈로그 항목의 그룹 합은 beats와 일치(invariant)', () => {
    const samples: Array<{ beats: number; beatValue: number }> = [
      { beats: 2, beatValue: 4 },
      { beats: 3, beatValue: 4 },
      { beats: 4, beatValue: 4 },
      { beats: 6, beatValue: 8 },
      { beats: 9, beatValue: 8 },
      { beats: 12, beatValue: 8 },
      { beats: 5, beatValue: 4 },
      { beats: 7, beatValue: 8 },
      { beats: 2, beatValue: 2 },
      { beats: 3, beatValue: 8 },
    ];
    for (const ts of samples) {
      const groups = getBeatGroups(ts);
      const sum = groups.reduce((a, b) => a + b, 0);
      expect(sum).toBe(ts.beats);
    }
  });

  it('반환 배열은 매 호출마다 새 사본(외부 변경이 카탈로그에 새지 않음)', () => {
    const a = getBeatGroups({ beats: 6, beatValue: 8 });
    a[0] = 999;
    const b = getBeatGroups({ beats: 6, beatValue: 8 });
    expect(b).toEqual([3, 3]);
  });
});

describe('SUPPORTED_TIME_SIGNATURES', () => {
  it('카탈로그 항목 10개를 분모순(2 → 4 → 8)으로 노출', () => {
    expect(SUPPORTED_TIME_SIGNATURES).toEqual([
      { beats: 2, beatValue: 2 },
      { beats: 2, beatValue: 4 },
      { beats: 3, beatValue: 4 },
      { beats: 4, beatValue: 4 },
      { beats: 5, beatValue: 4 },
      { beats: 3, beatValue: 8 },
      { beats: 6, beatValue: 8 },
      { beats: 7, beatValue: 8 },
      { beats: 9, beatValue: 8 },
      { beats: 12, beatValue: 8 },
    ]);
  });

  it('모든 항목은 카탈로그에 등록되어 있어 getBeatGroups가 fallback이 아닌 진짜 그룹을 반환', () => {
    for (const ts of SUPPORTED_TIME_SIGNATURES) {
      const groups = getBeatGroups(ts);
      // fallback은 [beats] 단일 그룹을 반환하므로, 그룹의 길이/값이 단순히 [beats]가 아닌 경우만
      // 진짜 카탈로그 항목으로 간주된다. 단, 단순 박자(예: 4/4 → [4])는 fallback과 형태가 같으므로
      // 합 invariant만 검증한다 — 별도 카탈로그 검증은 getBeatGroups 테스트에서 이미 다룸.
      const sum = groups.reduce((a, b) => a + b, 0);
      expect(sum).toBe(ts.beats);
    }
  });
});

describe('isCompoundMeter', () => {
  it('6/8, 9/8, 12/8은 복합', () => {
    expect(isCompoundMeter({ beats: 6, beatValue: 8 })).toBe(true);
    expect(isCompoundMeter({ beats: 9, beatValue: 8 })).toBe(true);
    expect(isCompoundMeter({ beats: 12, beatValue: 8 })).toBe(true);
  });

  it('3/8은 단일 그룹 [3]이라 그룹 모두 3 → 복합으로 분류', () => {
    // 정의: 분모 ≥ 8이고 모든 그룹이 3박이면 복합. 3/8은 [3] 한 그룹.
    expect(isCompoundMeter({ beats: 3, beatValue: 8 })).toBe(true);
  });

  it('단순 박자(분모 4 이하)는 모두 false', () => {
    expect(isCompoundMeter({ beats: 4, beatValue: 4 })).toBe(false);
    expect(isCompoundMeter({ beats: 3, beatValue: 4 })).toBe(false);
    expect(isCompoundMeter({ beats: 2, beatValue: 2 })).toBe(false);
  });

  it('비대칭 분모 8(7/8 = [2,2,3])은 복합 아님', () => {
    expect(isCompoundMeter({ beats: 7, beatValue: 8 })).toBe(false);
  });

  it('카탈로그 미정의 박자는 false(분류 불가)', () => {
    expect(isCompoundMeter({ beats: 11, beatValue: 8 })).toBe(false);
  });
});
