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
      pitch: 'C4',
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

  it('insertRest appends a rest note (pitch empty, isRest true) to bar', () => {
    const node = score('score 4/4');
    const next = applyScoreCommand(node, {
      type: 'insertRest',
      barIndex: 0,
      duration: 'q',
    });
    expect(next.bars[0]?.notes.length).toBe(1);
    expect(next.bars[0]?.notes[0]).toEqual({
      pitch: '',
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

  it('replaceNote: h를 q로 교체 시 pitch 유지, 박자 갱신', () => {
    // 정확히 4박을 채운 fixture여야 padding rest가 안 끼어 의도한 박자 분배가 보존된다.
    const node = score('score 4/4\n  C4/h D4/h |');
    const next = applyScoreCommand(node, {
      type: 'replaceNote',
      barIndex: 0,
      noteIndex: 0,
      duration: 'q',
    });
    expect(next.bars[0]?.notes[0]).toEqual({
      pitch: 'C4',
      duration: 'q',
      beats: 1,
      isRest: false,
    });
    expect(next.bars[0]?.notes[1]).toEqual(
      expect.objectContaining({ pitch: 'D4', duration: 'h' }),
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

  it('replaceWithRest: 음표를 쉼표로 교체 (pitch 비움, isRest:true)', () => {
    const node = score('score 4/4\n  C4/q D4/q |');
    const next = applyScoreCommand(node, {
      type: 'replaceWithRest',
      barIndex: 0,
      noteIndex: 0,
      duration: 'q',
    });
    expect(next.bars[0]?.notes[0]).toEqual({
      pitch: '',
      duration: 'q',
      beats: 1,
      isRest: true,
    });
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
