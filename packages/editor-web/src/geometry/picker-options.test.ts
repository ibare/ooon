import { describe, expect, it } from 'vitest';
import { buildPickerOptions, buildReplaceOptions } from './picker-options.js';

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

  it('점음표는 비점음표와 같은 글리프 + dotted=true (음표만)', () => {
    const opts = buildPickerOptions({ remainBeats: 4, beatsPerBar: 4 });
    const notes = opts.filter((o) => o.kind === 'insertNote');
    const q = notes.find((o) => o.duration === 'q');
    const qDot = notes.find((o) => o.duration === 'q.');
    expect(q?.glyph).toBe('noteQuarterUp');
    expect(qDot?.glyph).toBe('noteQuarterUp');
    expect(q?.dotted).toBe(false);
    expect(qDot?.dotted).toBe(true);
  });

  it('음표 duration별 글리프 매핑', () => {
    const opts = buildPickerOptions({ remainBeats: 4, beatsPerBar: 4 });
    const notes = opts.filter((o) => o.kind === 'insertNote');
    const byDur = (d: string) => notes.find((o) => o.duration === d);
    expect(byDur('w')?.glyph).toBe('noteWhole');
    expect(byDur('h')?.glyph).toBe('noteHalfUp');
    expect(byDur('e')?.glyph).toBe('note8thUp');
    expect(byDur('s')?.glyph).toBe('note16thUp');
  });

  it('각 옵션은 insertNote 또는 insertRest kind를 갖는다', () => {
    const opts = buildPickerOptions({ remainBeats: 4, beatsPerBar: 4 });
    expect(opts.length).toBeGreaterThan(0);
    for (const o of opts) {
      expect(['insertNote', 'insertRest']).toContain(o.kind);
    }
  });

  it('빈 4/4 마디에서 음표 9개 + 쉼표 9개 = 18개 노출, 음표가 먼저', () => {
    const opts = buildPickerOptions({ remainBeats: 4, beatsPerBar: 4 });
    const notes = opts.filter((o) => o.kind === 'insertNote');
    const rests = opts.filter((o) => o.kind === 'insertRest');
    expect(notes.length).toBe(9);
    expect(rests.length).toBe(9);
    expect(opts.length).toBe(18);
    for (let i = 0; i < 9; i++) expect(opts[i]?.kind).toBe('insertNote');
    for (let i = 9; i < 18; i++) expect(opts[i]?.kind).toBe('insertRest');
  });

  it('쉼표 duration별 글리프 매핑 (점쉼표는 베이스와 동일 글리프 + dotted=true)', () => {
    const opts = buildPickerOptions({ remainBeats: 4, beatsPerBar: 4 });
    const rests = opts.filter((o) => o.kind === 'insertRest');
    const byDur = (d: string) => rests.find((o) => o.duration === d);
    expect(byDur('w')?.glyph).toBe('restWhole');
    expect(byDur('h')?.glyph).toBe('restHalf');
    expect(byDur('h.')?.glyph).toBe('restHalf');
    expect(byDur('q')?.glyph).toBe('restQuarter');
    expect(byDur('q.')?.glyph).toBe('restQuarter');
    expect(byDur('e')?.glyph).toBe('rest8th');
    expect(byDur('e.')?.glyph).toBe('rest8th');
    expect(byDur('s')?.glyph).toBe('rest16th');
    expect(byDur('s.')?.glyph).toBe('rest16th');
    expect(byDur('h')?.dotted).toBe(false);
    expect(byDur('h.')?.dotted).toBe(true);
    expect(byDur('q.')?.dotted).toBe(true);
  });

  it('남은 1박에서는 음표/쉼표 모두 q 이하만 노출', () => {
    const opts = buildPickerOptions({ remainBeats: 1, beatsPerBar: 4 });
    const rests = opts.filter((o) => o.kind === 'insertRest');
    const restDurs = rests.map((o) => o.duration);
    expect(restDurs).not.toContain('w');
    expect(restDurs).not.toContain('h');
    expect(restDurs).toContain('q');
    expect(restDurs).toContain('e');
    expect(restDurs).toContain('s');
  });
});

describe('buildReplaceOptions', () => {
  it('현재 음표 q (other=0, 4/4) → q 음표만 빠진 17개 (음표8 + 쉼표9)', () => {
    const opts = buildReplaceOptions({
      currentDuration: 'q',
      currentIsRest: false,
      beatsPerBar: 4,
      otherUsedBeats: 0,
    });
    const notes = opts.filter((o) => o.kind === 'replaceNote');
    const rests = opts.filter((o) => o.kind === 'replaceWithRest');
    expect(notes.length).toBe(8);
    expect(rests.length).toBe(9);
    expect(notes.some((o) => o.duration === 'q')).toBe(false);
    // 같은 duration의 쉼표는 남는다 (kind가 다르므로 자기 자신 아님)
    expect(rests.some((o) => o.duration === 'q')).toBe(true);
  });

  it('현재 쉼표 q (other=0, 4/4) → q 쉼표만 빠진 17개 (음표9 + 쉼표8)', () => {
    const opts = buildReplaceOptions({
      currentDuration: 'q',
      currentIsRest: true,
      beatsPerBar: 4,
      otherUsedBeats: 0,
    });
    const notes = opts.filter((o) => o.kind === 'replaceNote');
    const rests = opts.filter((o) => o.kind === 'replaceWithRest');
    expect(notes.length).toBe(9);
    expect(rests.length).toBe(8);
    expect(rests.some((o) => o.duration === 'q')).toBe(false);
    expect(notes.some((o) => o.duration === 'q')).toBe(true);
  });

  it('마디가 꽉 찬 4/4에서 q 음표 클릭(other=3) → allowed=1, q 이하만 + 자기 q 음표 제외', () => {
    const opts = buildReplaceOptions({
      currentDuration: 'q',
      currentIsRest: false,
      beatsPerBar: 4,
      otherUsedBeats: 3,
    });
    const notes = opts.filter((o) => o.kind === 'replaceNote');
    const rests = opts.filter((o) => o.kind === 'replaceWithRest');
    // allowed=1: 음표 q.(1.5) h h. w 빠짐 → q,e.,e,s.,s 5개에서 자기 q 빼면 4개
    expect(notes.map((o) => o.duration).sort()).toEqual(['e', 'e.', 's', 's.']);
    // 쉼표는 q,e,s, e., s. 5개 모두 (자기는 음표 q이므로 쉼표 q는 남음)
    expect(rests.map((o) => o.duration).sort()).toEqual(['e', 'e.', 'q', 's', 's.']);
  });

  it('점음표 q. 클릭(other=0) → q. 만 빠지고 q는 남음', () => {
    const opts = buildReplaceOptions({
      currentDuration: 'q.',
      currentIsRest: false,
      beatsPerBar: 4,
      otherUsedBeats: 0,
    });
    const notes = opts.filter((o) => o.kind === 'replaceNote');
    expect(notes.some((o) => o.duration === 'q.')).toBe(false);
    expect(notes.some((o) => o.duration === 'q')).toBe(true);
  });

  it('allowed=0이면 빈 배열', () => {
    const opts = buildReplaceOptions({
      currentDuration: 'q',
      currentIsRest: false,
      beatsPerBar: 4,
      otherUsedBeats: 4,
    });
    expect(opts).toEqual([]);
  });
});
