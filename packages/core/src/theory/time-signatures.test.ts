import { describe, expect, it } from 'vitest';
import { getBeatGroups } from './time-signatures.js';

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
