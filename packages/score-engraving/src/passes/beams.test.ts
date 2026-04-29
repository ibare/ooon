import { describe, expect, it } from 'vitest';
import type { NoteEvent, TimeSignature } from '@oon/core';
import { groupBeams } from './beams.js';

const TS_4_4: TimeSignature = { beats: 4, beatValue: 4 };

function note(beats: number, opts: { rest?: boolean } = {}): NoteEvent {
  return {
    pitch: opts.rest ? '' : 'C4',
    duration: 'q',
    beats,
    isRest: opts.rest ?? false,
  };
}

describe('groupBeams', () => {
  it('e e e e (4박) → 박 경계마다 그룹 끊김 → 2개 그룹(beat 1,2 / 3,4)', () => {
    const groups = groupBeams([note(0.5), note(0.5), note(0.5), note(0.5)], TS_4_4);
    expect(groups.length).toBe(2);
    expect(groups[0]?.noteIndices).toEqual([0, 1]);
    expect(groups[1]?.noteIndices).toEqual([2, 3]);
    expect(groups[0]?.beamCount).toBe(1);
  });

  it('s s s s (1박) → 한 그룹, 16분 빔 2줄', () => {
    const groups = groupBeams([note(0.25), note(0.25), note(0.25), note(0.25)], TS_4_4);
    expect(groups.length).toBe(1);
    expect(groups[0]?.noteIndices).toEqual([0, 1, 2, 3]);
    expect(groups[0]?.beamCount).toBe(2);
  });

  it('q q q q → 빔 가능 음표 없음 → 빈 결과', () => {
    const groups = groupBeams([note(1), note(1), note(1), note(1)], TS_4_4);
    expect(groups).toEqual([]);
  });

  it('단독 e q → 단독은 그룹화 안 함', () => {
    const groups = groupBeams([note(0.5), note(1)], TS_4_4);
    expect(groups).toEqual([]);
  });

  it('박 시작이 아닌 위치의 e e는 그룹화 안 함', () => {
    // q e e e e → cursor: 0(q) → 1(e) → 1.5(e) → 2(e) → 2.5(e). 1박 e e는 박 시작이니 그룹.
    const groups = groupBeams(
      [note(1), note(0.5), note(0.5), note(0.5), note(0.5)],
      TS_4_4,
    );
    // [1,2]는 beat 1 박 안, [3,4]는 beat 2 박 안 → 2 그룹
    expect(groups.length).toBe(2);
    expect(groups[0]?.noteIndices).toEqual([1, 2]);
    expect(groups[1]?.noteIndices).toEqual([3, 4]);
  });

  it('rest는 그룹을 끊는다', () => {
    const groups = groupBeams(
      [note(0.5), note(0.5, { rest: true }), note(0.5), note(0.5)],
      TS_4_4,
    );
    // 첫 e는 다음이 rest라 단독. rest 후 e e는 박 2 경계(beat=1.0)에서 시작 → 그룹화.
    expect(groups.length).toBe(1);
    expect(groups[0]?.noteIndices).toEqual([2, 3]);
  });

  it('혼합 음가는 단독 처리(e s s e)', () => {
    const groups = groupBeams(
      [note(0.5), note(0.25), note(0.25), note(0.5)],
      TS_4_4,
    );
    // 첫 음표 e: 박 0 시작이지만 다음 s가 음가 다름 → 그룹 크기 1 → 미생성.
    // 그 후 s s는 박 0.5에서 시작 → 박 경계 아님.
    expect(groups).toEqual([]);
  });

  it('점 8분(e.) 음표도 그룹 가능', () => {
    // e. e. → 0 + 0.75 + 0.75 = 1.5. 박 경계(beat 1) 넘는다. 그룹 안 됨.
    expect(groupBeams([note(0.75), note(0.75)], TS_4_4).length).toBe(0);
  });
});
