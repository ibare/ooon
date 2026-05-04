import { describe, expect, it } from 'vitest';
import { parseBlock } from '@oon/core';
import type { ScoreNode } from '@oon/core';
import { applyScoreCommand, CommandError } from './commands.js';

function score(dsl: string): ScoreNode {
  const n = parseBlock(dsl);
  if (n.type !== 'score') throw new Error('expected score');
  return n;
}

describe('applyScoreCommand', () => {
  it('insertNote appends to bar and computes beats from duration', () => {
    const node = score('score 4/4');
    const next = applyScoreCommand(node, {
      type: 'insertNote',
      barIndex: 0,
      pitch: 'C4',
      duration: 'q',
    });
    expect(next.bars[0]?.notes.length).toBe(1);
    expect(next.bars[0]?.notes[0]).toEqual({
      pitches: ['C4'],
      duration: 'q',
      beats: 1,
      isRest: false,
    });
    // 입력 노드는 변경되지 않는다.
    expect(node.bars[0]?.notes.length).toBe(0);
  });

  it('insertNote dotted-half resolves to 3 beats', () => {
    const node = score('score 4/4');
    const next = applyScoreCommand(node, {
      type: 'insertNote',
      barIndex: 0,
      pitch: 'A4',
      duration: 'h.',
    });
    expect(next.bars[0]?.notes[0]?.beats).toBe(3);
  });

  it('insertNote throws when duration exceeds remaining beats', () => {
    const node = score('score 4/4\n  C4/h C4/q |');
    expect(() =>
      applyScoreCommand(node, {
        type: 'insertNote',
        barIndex: 0,
        pitch: 'D4',
        duration: 'h',
      }),
    ).toThrow(CommandError);
  });

  it('insertNote throws when bar index is invalid', () => {
    const node = score('score 4/4');
    expect(() =>
      applyScoreCommand(node, {
        type: 'insertNote',
        barIndex: 9,
        pitch: 'C4',
        duration: 'q',
      }),
    ).toThrow(CommandError);
  });

  it('insertRest appends a rest note (pitches empty, isRest true) to bar', () => {
    const node = score('score 4/4');
    const next = applyScoreCommand(node, {
      type: 'insertRest',
      barIndex: 0,
      duration: 'q',
    });
    expect(next.bars[0]?.notes.length).toBe(1);
    expect(next.bars[0]?.notes[0]).toEqual({
      pitches: [],
      duration: 'q',
      beats: 1,
      isRest: true,
    });
    expect(node.bars[0]?.notes.length).toBe(0);
  });

  it('insertRest throws when duration exceeds remaining beats', () => {
    const node = score('score 4/4\n  C4/h C4/q |');
    expect(() =>
      applyScoreCommand(node, {
        type: 'insertRest',
        barIndex: 0,
        duration: 'h',
      }),
    ).toThrow(CommandError);
  });

  it('insertRest throws when bar index is invalid', () => {
    const node = score('score 4/4');
    expect(() =>
      applyScoreCommand(node, {
        type: 'insertRest',
        barIndex: 9,
        duration: 'q',
      }),
    ).toThrow(CommandError);
  });

  it('replaceNote: h를 q로 교체 시 pitches 유지, 박자 갱신', () => {
    // 정확히 4박을 채운 fixture여야 padding rest가 안 끼어 의도한 박자 분배가 보존된다.
    const node = score('score 4/4\n  C4/h D4/h |');
    const next = applyScoreCommand(node, {
      type: 'replaceNote',
      barIndex: 0,
      noteIndex: 0,
      duration: 'q',
    });
    expect(next.bars[0]?.notes[0]).toEqual({
      pitches: ['C4'],
      duration: 'q',
      beats: 1,
      isRest: false,
    });
    expect(next.bars[0]?.notes[1]).toEqual(
      expect.objectContaining({ pitches: ['D4'], duration: 'h' }),
    );
    // 입력 노드는 변경되지 않는다.
    expect(node.bars[0]?.notes[0]?.duration).toBe('h');
  });

  it('replaceNote: 박자 초과 시 throw (자기 외 합 + new > 마디)', () => {
    const node = score('score 4/4\n  C4/q D4/h E4/q |');
    expect(() =>
      applyScoreCommand(node, {
        type: 'replaceNote',
        barIndex: 0,
        noteIndex: 0,
        duration: 'h.',
      }),
    ).toThrow(CommandError);
  });

  it('replaceNote: noteIndex가 없으면 throw', () => {
    const node = score('score 4/4\n  C4/q |');
    expect(() =>
      applyScoreCommand(node, {
        type: 'replaceNote',
        barIndex: 0,
        noteIndex: 5,
        duration: 'q',
      }),
    ).toThrow(CommandError);
  });

  it('replaceNote: source가 쉼표면 throw (pitch 불명)', () => {
    const node = score('score 4/4\n  r/q C4/q |');
    expect(() =>
      applyScoreCommand(node, {
        type: 'replaceNote',
        barIndex: 0,
        noteIndex: 0,
        duration: 'h',
      }),
    ).toThrow(CommandError);
  });

  it('replaceWithRest: 음표를 쉼표로 교체 (pitches 비움, isRest:true)', () => {
    const node = score('score 4/4\n  C4/q D4/q |');
    const next = applyScoreCommand(node, {
      type: 'replaceWithRest',
      barIndex: 0,
      noteIndex: 0,
      duration: 'q',
    });
    expect(next.bars[0]?.notes[0]).toEqual({
      pitches: [],
      duration: 'q',
      beats: 1,
      isRest: true,
    });
  });

  it('transposeNote: 단음 ↑/↓ 한 단계(반음, ↑은 ♯/↓은 ♭)', () => {
    const node = score('score 4/4\n  C4/q |');
    const up = applyScoreCommand(node, { type: 'transposeNote', barIndex: 0, noteIndex: 0, direction: 'up' });
    expect(up.bars[0]?.notes[0]?.pitches).toEqual(['C#4']);
    const down = applyScoreCommand(node, { type: 'transposeNote', barIndex: 0, noteIndex: 0, direction: 'down' });
    expect(down.bars[0]?.notes[0]?.pitches).toEqual(['B3']);
  });

  it('transposeNote: 화음은 head별 독립 +1/-1 (head별 enharmonic 정책 자동 적용)', () => {
    const node = score('score 4/4\n  [C4 E4 G4]/q |');
    const up = applyScoreCommand(node, { type: 'transposeNote', barIndex: 0, noteIndex: 0, direction: 'up' });
    expect(up.bars[0]?.notes[0]?.pitches).toEqual(['C#4', 'F4', 'G#4']);
  });

  it('transposeNote: 쉼표는 거부', () => {
    const node = score('score 4/4\n  r/q |');
    expect(() =>
      applyScoreCommand(node, { type: 'transposeNote', barIndex: 0, noteIndex: 0, direction: 'up' }),
    ).toThrow(CommandError);
  });

  it('addChordPitch: 단음에 pitch 추가 → 화음', () => {
    const node = score('score 4/4\n  C4/q |');
    const next = applyScoreCommand(node, { type: 'addChordPitch', barIndex: 0, noteIndex: 0, pitch: 'E4' });
    expect(next.bars[0]?.notes[0]?.pitches).toEqual(['C4', 'E4']);
  });

  it('addChordPitch: 화음에 head 추가', () => {
    const node = score('score 4/4\n  [C4 E4]/q |');
    const next = applyScoreCommand(node, { type: 'addChordPitch', barIndex: 0, noteIndex: 0, pitch: 'G4' });
    expect(next.bars[0]?.notes[0]?.pitches).toEqual(['C4', 'E4', 'G4']);
  });

  it('addChordPitch: 중복 pitch 거부', () => {
    const node = score('score 4/4\n  [C4 E4]/q |');
    expect(() =>
      applyScoreCommand(node, { type: 'addChordPitch', barIndex: 0, noteIndex: 0, pitch: 'C4' }),
    ).toThrow(CommandError);
  });

  it('addChordPitch: 쉼표 거부', () => {
    const node = score('score 4/4\n  r/q |');
    expect(() =>
      applyScoreCommand(node, { type: 'addChordPitch', barIndex: 0, noteIndex: 0, pitch: 'C4' }),
    ).toThrow(CommandError);
  });

  it('removeChordHead: 특정 head 제거', () => {
    const node = score('score 4/4\n  [C4 E4 G4]/q |');
    const next = applyScoreCommand(node, { type: 'removeChordHead', barIndex: 0, noteIndex: 0, pitchIndex: 1 });
    expect(next.bars[0]?.notes[0]?.pitches).toEqual(['C4', 'G4']);
  });

  it('removeChordHead: 화음에서 head 제거 후 1개 남으면 자동 단음 강등', () => {
    const node = score('score 4/4\n  [C4 E4]/q |');
    const next = applyScoreCommand(node, { type: 'removeChordHead', barIndex: 0, noteIndex: 0, pitchIndex: 1 });
    expect(next.bars[0]?.notes[0]?.pitches).toEqual(['C4']);
  });

  it('removeChordHead: 마지막 head 보존(거부)', () => {
    const node = score('score 4/4\n  C4/q |');
    expect(() =>
      applyScoreCommand(node, { type: 'removeChordHead', barIndex: 0, noteIndex: 0, pitchIndex: 0 }),
    ).toThrow(CommandError);
  });

  it('removeChordHead: pitchIndex 범위 밖 거부', () => {
    const node = score('score 4/4\n  [C4 E4]/q |');
    expect(() =>
      applyScoreCommand(node, { type: 'removeChordHead', barIndex: 0, noteIndex: 0, pitchIndex: 5 }),
    ).toThrow(CommandError);
  });

  it('setTimeSignature resets bars to a single empty bar', () => {
    const node = score('score 4/4\n  C4/q D4/q E4/q F4/q |');
    const next = applyScoreCommand(node, {
      type: 'setTimeSignature',
      timeSignature: { beats: 3, beatValue: 4 },
    });
    expect(next.timeSignature).toEqual({ beats: 3, beatValue: 4 });
    expect(next.bars.length).toBe(1);
    expect(next.bars[0]?.notes.length).toBe(0);
  });
});
