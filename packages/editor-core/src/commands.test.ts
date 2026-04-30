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
