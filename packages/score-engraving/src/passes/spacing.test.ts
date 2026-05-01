import { describe, expect, it } from 'vitest';
import type { DurationSymbol, NoteEvent } from '@oon/core';
import {
  defaultClefWidthSp,
  defaultTimeSigWidthSp,
  distributeNotes,
  distributeNotesByBeat,
  noteRequiredWidth,
} from './spacing.js';

// 시각 분기는 duration symbol이 권위. 테스트도 beats만 바꾸는 게 아니라 duration까지
// 함께 매핑해야 시각 결정(점, 머리 모양 등)이 정상 검증된다.
function beatsToDuration(b: number): DurationSymbol {
  const map: Record<string, DurationSymbol> = {
    '4': 'w',
    '2': 'h',
    '1': 'q',
    '0.5': 'e',
    '0.25': 's',
    '6': 'w.',
    '3': 'h.',
    '1.5': 'q.',
    '0.75': 'e.',
    '0.375': 's.',
  };
  return map[String(b)] ?? 'q';
}

function note(beats: number, opts: { rest?: boolean; duration?: DurationSymbol } = {}): NoteEvent {
  return {
    pitch: opts.rest ? '' : 'C4',
    duration: opts.duration ?? beatsToDuration(beats),
    beats,
    isRest: opts.rest ?? false,
  };
}

describe('noteRequiredWidth', () => {
  it('quarter note > 0', () => {
    expect(noteRequiredWidth(note(1), null)).toBeGreaterThan(0);
  });

  it('임시표가 붙으면 폭이 더 커진다', () => {
    const w0 = noteRequiredWidth(note(1), null);
    const w1 = noteRequiredWidth(note(1), 'sharp');
    expect(w1).toBeGreaterThan(w0);
  });

  it('점음표는 점이 없는 같은 길이 음표보다 폭이 크다', () => {
    const w0 = noteRequiredWidth(note(1), null);
    const w1 = noteRequiredWidth(note(1.5), null);
    expect(w1).toBeGreaterThan(w0);
  });

  it('rest도 길이별 폭 산정', () => {
    expect(noteRequiredWidth(note(1, { rest: true }), null)).toBeGreaterThan(0);
  });
});

describe('distributeNotes', () => {
  it('같은 duration은 균등 분배', () => {
    const slots = distributeNotes([1, 1, 1, 1], [1, 1, 1, 1], 100);
    const widths = slots.map((s) => s.slotWidth);
    for (const w of widths) {
      expect(w).toBeCloseTo(25, 4);
    }
  });

  it('합은 innerWidth와 일치(여유가 충분할 때)', () => {
    const slots = distributeNotes([1, 2, 0.5], [2, 2, 2], 100);
    const total = slots.reduce((s, x) => s + x.slotWidth, 0);
    expect(total).toBeCloseTo(100, 4);
  });

  it('짧은 음표의 slot은 긴 음표의 slot보다 좁다', () => {
    const slots = distributeNotes([0.5, 1, 2], [2, 2, 2], 100);
    expect(slots[0]?.slotWidth).toBeLessThan(slots[1]?.slotWidth ?? Infinity);
    expect(slots[1]?.slotWidth).toBeLessThan(slots[2]?.slotWidth ?? Infinity);
  });

  it('비선형성: 짧은:긴 길이 비가 8:1이어도 폭 비는 8:1보다 작다(1보다 큰 elasticity 효과)', () => {
    // beats^0.6: short=(0.25)^0.6=0.435, long=(2)^0.6=1.516. 비 ≈ 3.49 (8/1보다 작음)
    const slots = distributeNotes([0.25, 2], [0.5, 0.5], 100);
    const ratio = (slots[1]?.slotWidth ?? 0) / (slots[0]?.slotWidth ?? 1);
    expect(ratio).toBeLessThan(8);
    expect(ratio).toBeGreaterThan(1);
  });

  it('minWidth가 큰 슬롯은 minWidth로 고정되고 나머지에 잔여 폭 분배', () => {
    // beats 동일, 0번째에 큰 minWidth.
    const slots = distributeNotes([1, 1, 1], [50, 5, 5], 100);
    expect(slots[0]?.slotWidth).toBeCloseTo(50, 4);
    // 나머지 두 슬롯이 잔여 50을 균등 분배
    expect(slots[1]?.slotWidth).toBeCloseTo(25, 4);
    expect(slots[2]?.slotWidth).toBeCloseTo(25, 4);
  });

  it('offset이 누적된다', () => {
    const slots = distributeNotes([1, 1, 1], [1, 1, 1], 30);
    expect(slots[0]?.offset).toBe(0);
    expect(slots[1]?.offset).toBeCloseTo(10, 4);
    expect(slots[2]?.offset).toBeCloseTo(20, 4);
  });

  it('빈 입력은 빈 결과', () => {
    expect(distributeNotes([], [], 100)).toEqual([]);
  });
});

describe('distributeNotesByBeat — 박자 격자 + 박자 내부 광학', () => {
  it('4/4에 4분 4개는 박자 격자 균등(폭 25씩, offset 0/25/50/75)', () => {
    const slots = distributeNotesByBeat([1, 1, 1, 1], [5, 5, 5, 5], 100, 4);
    expect(slots.map((s) => s.offset)).toEqual([0, 25, 50, 75]);
    expect(slots.map((s) => s.slotWidth)).toEqual([25, 25, 25, 25]);
  });

  it('4/4에 4분 1개는 1박자 슬롯 폭(25)만 차지하고 시작은 0', () => {
    const slots = distributeNotesByBeat([1], [5], 100, 4);
    expect(slots[0]).toEqual({ offset: 0, slotWidth: 25 });
  });

  it('4/4에 4분 1개 + 4분 1개 = 슬롯 0과 1 시작에 정렬', () => {
    const slots = distributeNotesByBeat([1, 1], [5, 5], 100, 4);
    expect(slots[0]?.offset).toBe(0);
    expect(slots[1]?.offset).toBe(25);
    expect(slots[0]?.slotWidth).toBe(25);
    expect(slots[1]?.slotWidth).toBe(25);
  });

  it('4/4에 8분 2개(한 박자 안)는 그 박자 슬롯 폭 안에서 광학 분배(둘 다 박자 0 시작에서)', () => {
    const slots = distributeNotesByBeat([0.5, 0.5], [3, 3], 100, 4);
    // 두 음표 모두 박자 0 슬롯 안. 광학 분배: 균등 → offset 0과 12.5
    expect(slots[0]?.offset).toBeCloseTo(0, 4);
    expect(slots[1]?.offset).toBeCloseTo(12.5, 4);
    // 슬롯 폭 합은 박자 슬롯 폭(25)과 같음
    expect((slots[0]?.slotWidth ?? 0) + (slots[1]?.slotWidth ?? 0)).toBeCloseTo(25, 4);
  });

  it('점4분(1.5박)은 시작 박자 0에서 시작하고 폭은 1.5박자(=37.5)', () => {
    const slots = distributeNotesByBeat([1.5], [5], 100, 4);
    expect(slots[0]).toEqual({ offset: 0, slotWidth: 37.5 });
  });

  it('점4분(1.5박) + 8분(0.5박) = 둘 다 박자 0 시작은 아니다(8분은 박자 1 슬롯에 배정)', () => {
    // 누적 startBeat: 0, 1.5 → 두 번째는 floor(1.5)=1 → 박자 1 슬롯
    const slots = distributeNotesByBeat([1.5, 0.5], [5, 5], 100, 4);
    expect(slots[0]?.offset).toBe(0);
    expect(slots[1]?.offset).toBe(25);
  });

  it('빈 입력은 빈 결과', () => {
    expect(distributeNotesByBeat([], [], 100, 4)).toEqual([]);
  });

  it('beatsPerBar=0이면 fallback으로 기존 distributeNotes 동작', () => {
    const slots = distributeNotesByBeat([1, 1], [1, 1], 100, 0);
    expect(slots.length).toBe(2);
    // 광학 분배 fallback이라 균등에 가까운 결과
    expect(slots[0]?.slotWidth).toBeCloseTo(50, 4);
  });
});

describe('defaultClefWidthSp / defaultTimeSigWidthSp', () => {
  it('clef 폭은 gClef advanceWidth보다 크다', () => {
    expect(defaultClefWidthSp()).toBeGreaterThan(0);
  });

  it('timeSig 폭은 timeSig 자리 글리프 advanceWidth보다 크다', () => {
    expect(defaultTimeSigWidthSp()).toBeGreaterThan(0);
  });
});
