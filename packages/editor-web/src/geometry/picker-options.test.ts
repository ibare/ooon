import { describe, expect, it } from 'vitest';
import { buildPickerOptions } from './picker-options.js';

describe('buildPickerOptions', () => {
  it('빈 4/4 마디(remain=4)에서는 모든 후보 노출', () => {
    const opts = buildPickerOptions({ remainBeats: 4, beatsPerBar: 4 });
    const durs = opts.map((o) => o.duration);
    expect(durs).toContain('w');
    expect(durs).toContain('h.');
    expect(durs).toContain('q');
    expect(durs).toContain('s');
  });

  it('남은 1박에서는 q 이하만 노출', () => {
    const opts = buildPickerOptions({ remainBeats: 1, beatsPerBar: 4 });
    const durs = opts.map((o) => o.duration);
    expect(durs).not.toContain('w');
    expect(durs).not.toContain('h');
    expect(durs).toContain('q');
    expect(durs).toContain('e');
  });

  it('남은 0박에서는 빈 배열', () => {
    expect(buildPickerOptions({ remainBeats: 0, beatsPerBar: 4 })).toEqual([]);
  });

  it('ratio는 박자수/마디박자 비율', () => {
    const opts = buildPickerOptions({ remainBeats: 4, beatsPerBar: 4 });
    const w = opts.find((o) => o.duration === 'w');
    const q = opts.find((o) => o.duration === 'q');
    expect(w?.ratio).toBe(1);
    expect(q?.ratio).toBe(0.25);
  });
});
