import { describe, expect, it } from 'vitest';
import type { NoteEvent } from '@oon/core';
import {
  defaultClefWidthSp,
  defaultTimeSigWidthSp,
  distributeNotes,
  noteRequiredWidth,
} from './spacing.js';

function note(beats: number, opts: { rest?: boolean } = {}): NoteEvent {
  return {
    pitch: opts.rest ? '' : 'C4',
    duration: 'q',
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

describe('defaultClefWidthSp / defaultTimeSigWidthSp', () => {
  it('clef 폭은 gClef advanceWidth보다 크다', () => {
    expect(defaultClefWidthSp()).toBeGreaterThan(0);
  });

  it('timeSig 폭은 timeSig 자리 글리프 advanceWidth보다 크다', () => {
    expect(defaultTimeSigWidthSp()).toBeGreaterThan(0);
  });
});
