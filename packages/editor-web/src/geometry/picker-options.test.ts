import { describe, expect, it } from 'vitest';
import { SMUFL } from '@oon/core';
import { buildPickerOptions, buildReplaceOptions, buildTimeSigOptions } from './picker-options.js';

describe('buildPickerOptions', () => {
  it('빈 4/4 마디(remain=4)에서는 모든 후보 노출', () => {
    const opts = buildPickerOptions({ remainBeats: 4, beatsPerBar: 4, beatValue: 4 });
    const durs = opts.map((o) => o.duration);
    expect(durs).toContain('w');
    expect(durs).toContain('h.');
    expect(durs).toContain('q');
    expect(durs).toContain('s');
  });

  it('남은 1박에서는 q 이하만 노출', () => {
    const opts = buildPickerOptions({ remainBeats: 1, beatsPerBar: 4, beatValue: 4 });
    const durs = opts.map((o) => o.duration);
    expect(durs).not.toContain('w');
    expect(durs).not.toContain('h');
    expect(durs).toContain('q');
    expect(durs).toContain('e');
  });

  it('남은 0박에서는 빈 배열', () => {
    expect(buildPickerOptions({ remainBeats: 0, beatsPerBar: 4, beatValue: 4 })).toEqual([]);
  });

  it('점음표는 비점음표와 같은 글리프 + dotted=true (음표만)', () => {
    const opts = buildPickerOptions({ remainBeats: 4, beatsPerBar: 4, beatValue: 4 });
    const notes = opts.filter((o) => o.kind === 'insertNote');
    const q = notes.find((o) => o.duration === 'q');
    const qDot = notes.find((o) => o.duration === 'q.');
    expect(q?.glyph).toBe('noteQuarterUp');
    expect(qDot?.glyph).toBe('noteQuarterUp');
    expect(q?.dotted).toBe(false);
    expect(qDot?.dotted).toBe(true);
  });

  it('음표 duration별 글리프 매핑', () => {
    const opts = buildPickerOptions({ remainBeats: 4, beatsPerBar: 4, beatValue: 4 });
    const notes = opts.filter((o) => o.kind === 'insertNote');
    const byDur = (d: string) => notes.find((o) => o.duration === d);
    expect(byDur('w')?.glyph).toBe('noteWhole');
    expect(byDur('h')?.glyph).toBe('noteHalfUp');
    expect(byDur('e')?.glyph).toBe('note8thUp');
    expect(byDur('s')?.glyph).toBe('note16thUp');
  });

  it('각 옵션은 insertNote 또는 insertRest kind를 갖는다', () => {
    const opts = buildPickerOptions({ remainBeats: 4, beatsPerBar: 4, beatValue: 4 });
    expect(opts.length).toBeGreaterThan(0);
    for (const o of opts) {
      expect(['insertNote', 'insertRest']).toContain(o.kind);
    }
  });

  it('빈 4/4 마디에서 음표 9개 + 쉼표 9개 = 18개 노출, 음표가 먼저', () => {
    const opts = buildPickerOptions({ remainBeats: 4, beatsPerBar: 4, beatValue: 4 });
    const notes = opts.filter((o) => o.kind === 'insertNote');
    const rests = opts.filter((o) => o.kind === 'insertRest');
    expect(notes.length).toBe(9);
    expect(rests.length).toBe(9);
    expect(opts.length).toBe(18);
    for (let i = 0; i < 9; i++) expect(opts[i]?.kind).toBe('insertNote');
    for (let i = 9; i < 18; i++) expect(opts[i]?.kind).toBe('insertRest');
  });

  it('쉼표 duration별 글리프 매핑 (점쉼표는 베이스와 동일 글리프 + dotted=true)', () => {
    const opts = buildPickerOptions({ remainBeats: 4, beatsPerBar: 4, beatValue: 4 });
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
    const opts = buildPickerOptions({ remainBeats: 1, beatsPerBar: 4, beatValue: 4 });
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
  it('현재 음표 q 단음 (other=0, 4/4) → 같은 duration q는 addChordPitch로 발행, removeHead는 없음', () => {
    const opts = buildReplaceOptions({
      currentDuration: 'q',
      currentIsRest: false,
      currentPitches: ['C4'],
      beatsPerBar: 4,
      otherUsedBeats: 0,
      beatValue: 4,
    });
    const replaceNotes = opts.filter((o) => o.kind === 'replaceNote');
    const addChord = opts.filter((o) => o.kind === 'addChordPitch');
    const rests = opts.filter((o) => o.kind === 'replaceWithRest');
    const removeHead = opts.filter((o) => o.kind === 'removeChordHead');
    // 음표 9종 중 q는 addChordPitch로, 나머지 8종은 replaceNote.
    expect(replaceNotes.length).toBe(8);
    expect(replaceNotes.some((o) => o.duration === 'q')).toBe(false);
    expect(addChord.length).toBe(1);
    expect(addChord[0]?.duration).toBe('q');
    // 쉼표는 모두 그대로 (kind가 다르므로 자기 자신 아님)
    expect(rests.length).toBe(9);
    // 단음(=1 head) → removeChordHead 옵션 없음.
    expect(removeHead.length).toBe(0);
    // ▲▼ transpose는 picker 좌측 독립 컬럼이라 옵션 배열에 포함되지 않는다.
    expect(opts.some((o) => (o as { kind: string }).kind === 'transposeNote')).toBe(false);
  });

  it('현재 음표 q 화음 [C4 E4 G4] → addChordPitch + head 3개 모두 노출', () => {
    const opts = buildReplaceOptions({
      currentDuration: 'q',
      currentIsRest: false,
      currentPitches: ['C4', 'E4', 'G4'],
      beatsPerBar: 4,
      otherUsedBeats: 0,
      beatValue: 4,
    });
    const removeHead = opts.filter((o) => o.kind === 'removeChordHead');
    expect(removeHead.length).toBe(3);
    expect(removeHead.map((o) => o.pitch)).toEqual(['C4', 'E4', 'G4']);
    expect(removeHead.map((o) => o.pitchIndex)).toEqual([0, 1, 2]);
  });

  it('현재 쉼표 q (other=0, 4/4) → q 쉼표만 빠짐, 화음 옵션 없음', () => {
    const opts = buildReplaceOptions({
      currentDuration: 'q',
      currentIsRest: true,
      currentPitches: [],
      beatsPerBar: 4,
      otherUsedBeats: 0,
      beatValue: 4,
    });
    const notes = opts.filter((o) => o.kind === 'replaceNote');
    const addChord = opts.filter((o) => o.kind === 'addChordPitch');
    const rests = opts.filter((o) => o.kind === 'replaceWithRest');
    const removeHead = opts.filter((o) => o.kind === 'removeChordHead');
    expect(notes.length).toBe(9);
    expect(addChord.length).toBe(0);
    expect(rests.length).toBe(8);
    expect(rests.some((o) => o.duration === 'q')).toBe(false);
    expect(notes.some((o) => o.duration === 'q')).toBe(true);
    // 쉼표 source는 화음 옵션 발행 안 함.
    expect(removeHead.length).toBe(0);
  });

  it('마디가 꽉 찬 4/4에서 q 단음 클릭(other=3) → allowed=1, q 이하만 + q는 addChordPitch', () => {
    const opts = buildReplaceOptions({
      currentDuration: 'q',
      currentIsRest: false,
      currentPitches: ['C4'],
      beatsPerBar: 4,
      otherUsedBeats: 3,
      beatValue: 4,
    });
    const notes = opts.filter((o) => o.kind === 'replaceNote');
    const addChord = opts.filter((o) => o.kind === 'addChordPitch');
    const rests = opts.filter((o) => o.kind === 'replaceWithRest');
    // allowed=1: 음표 후보 q.(1.5) h h. w 빠짐 → q,e.,e,s.,s 5개. q는 addChord, 나머지 4개 replace.
    expect(notes.map((o) => o.duration).sort()).toEqual(['e', 'e.', 's', 's.']);
    expect(addChord.length).toBe(1);
    expect(addChord[0]?.duration).toBe('q');
    // 쉼표는 q,e,s, e., s. 5개 모두 (자기는 음표 q이므로 쉼표 q는 남음)
    expect(rests.map((o) => o.duration).sort()).toEqual(['e', 'e.', 'q', 's', 's.']);
  });

  it('점음표 q. 단음 클릭(other=0) → q.는 addChordPitch, q는 replaceNote 그대로', () => {
    const opts = buildReplaceOptions({
      currentDuration: 'q.',
      currentIsRest: false,
      currentPitches: ['C4'],
      beatsPerBar: 4,
      otherUsedBeats: 0,
      beatValue: 4,
    });
    const notes = opts.filter((o) => o.kind === 'replaceNote');
    const addChord = opts.filter((o) => o.kind === 'addChordPitch');
    expect(notes.some((o) => o.duration === 'q.')).toBe(false);
    expect(notes.some((o) => o.duration === 'q')).toBe(true);
    expect(addChord.length).toBe(1);
    expect(addChord[0]?.duration).toBe('q.');
  });

  it('addChordPitch 기본 추가 pitch는 최고음 + 4 semitone (장3도)', () => {
    const opts = buildReplaceOptions({
      currentDuration: 'q',
      currentIsRest: false,
      currentPitches: ['C4', 'E4'],
      beatsPerBar: 4,
      otherUsedBeats: 0,
      beatValue: 4,
    });
    const addChord = opts.find((o) => o.kind === 'addChordPitch');
    // E4 + 4 semitone = G#4 (♯ 우선)
    expect(addChord?.pitch).toBe('G#4');
  });

  it('allowed=0이면 빈 배열', () => {
    const opts = buildReplaceOptions({
      currentDuration: 'q',
      currentIsRest: false,
      currentPitches: ['C4'],
      beatsPerBar: 4,
      otherUsedBeats: 4,
      beatValue: 4,
    });
    expect(opts).toEqual([]);
  });
});

describe('buildTimeSigOptions', () => {
  it('current 미지정 시 코어 카탈로그 10종 모두 분모순 노출', () => {
    const opts = buildTimeSigOptions();
    expect(opts.length).toBe(10);
    const labels = opts.map((o) => o.label);
    expect(labels).toEqual([
      '2/2',
      '2/4',
      '3/4',
      '4/4',
      '5/4',
      '3/8',
      '6/8',
      '7/8',
      '9/8',
      '12/8',
    ]);
    for (const o of opts) expect(o.kind).toBe('setTimeSignature');
  });

  it('current=4/4면 4/4 제외하고 9종 노출(순서 보존)', () => {
    const opts = buildTimeSigOptions({ current: { beats: 4, beatValue: 4 } });
    expect(opts.length).toBe(9);
    expect(opts.map((o) => o.label)).toEqual([
      '2/2',
      '2/4',
      '3/4',
      '5/4',
      '3/8',
      '6/8',
      '7/8',
      '9/8',
      '12/8',
    ]);
  });

  it('current=6/8이면 6/8 제외하고 9종 노출(순서 보존)', () => {
    const opts = buildTimeSigOptions({ current: { beats: 6, beatValue: 8 } });
    expect(opts.length).toBe(9);
    expect(opts.map((o) => o.label)).toEqual([
      '2/2',
      '2/4',
      '3/4',
      '4/4',
      '5/4',
      '3/8',
      '7/8',
      '9/8',
      '12/8',
    ]);
  });

  it('각 옵션의 timeSignature/topGlyph/bottomGlyph는 SMUFL.timeSigNumber 결과와 일치', () => {
    const opts = buildTimeSigOptions();
    const six = opts.find((o) => o.label === '6/8')!;
    expect(six.timeSignature).toEqual({ beats: 6, beatValue: 8 });
    expect(six.topGlyph).toBe(SMUFL.timeSigNumber(6));
    expect(six.bottomGlyph).toBe(SMUFL.timeSigNumber(8));
    const four = opts.find((o) => o.label === '4/4')!;
    expect(four.topGlyph).toBe(SMUFL.timeSigNumber(4));
    expect(four.bottomGlyph).toBe(SMUFL.timeSigNumber(4));
    const twelve = opts.find((o) => o.label === '12/8')!;
    expect(twelve.topGlyph).toBe(SMUFL.timeSigNumber(12));
    expect(twelve.bottomGlyph).toBe(SMUFL.timeSigNumber(8));
  });

  it('카탈로그에 없는 박자(예: 11/8)를 current로 지정해도 후보는 10종 유지', () => {
    const opts = buildTimeSigOptions({ current: { beats: 11, beatValue: 8 } });
    expect(opts.length).toBe(10);
  });
});
