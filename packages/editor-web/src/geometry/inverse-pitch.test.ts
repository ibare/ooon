import { describe, expect, it } from 'vitest';
import { letterToStep, pitchAt } from './inverse-pitch.js';

const STAFF = { top: 100, bottom: 140, lineGap: 10, y: 120, lines: [100, 110, 120, 130, 140] };

describe('pitchAt', () => {
  it('보표 중앙(centerY=120)은 B4로 스냅된다 (treble clef 기본)', () => {
    const r = pitchAt({ y: 120, staff: STAFF });
    expect(r.pitch).toBe('B4');
    expect(r.snappedY).toBe(120);
  });

  it('한 line gap(10px) 위는 D5(B4의 2 step 위)로 스냅된다', () => {
    const r = pitchAt({ y: 110, staff: STAFF });
    expect(r.pitch).toBe('D5');
  });

  it('한 line gap 아래는 G4로 스냅된다', () => {
    const r = pitchAt({ y: 130, staff: STAFF });
    expect(r.pitch).toBe('G4');
  });

  it('스냅 오차가 ±0.25 sp 이내면 가장 가까운 step으로 반올림된다', () => {
    const r = pitchAt({ y: 121, staff: STAFF });
    expect(r.snappedY).toBe(120);
    expect(r.pitch).toBe('B4');
  });
});

describe('letterToStep', () => {
  it('B4 = 4*7+6 = 34', () => {
    expect(letterToStep('B', 4)).toBe(34);
  });

  it('C0 = 0', () => {
    expect(letterToStep('C', 0)).toBe(0);
  });
});
