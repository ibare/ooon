import { describe, expect, it } from 'vitest';
import { parseBlock } from './parser.js';
import { serializeScore } from './score-serializer.js';
import type { ScoreNode } from '../ast/types.js';

function reparse(dsl: string): ScoreNode {
  const n = parseBlock(dsl);
  if (n.type !== 'score') throw new Error('expected score');
  return n;
}

describe('serializeScore', () => {
  it('header-only score round-trips to bare header', () => {
    const node = reparse('score 4/4');
    expect(serializeScore(node)).toBe('score 4/4');
    const round = reparse(serializeScore(node));
    expect(round.bars.length).toBe(1);
    expect(round.bars[0]?.notes.length).toBe(0);
  });

  it('emits header+body with notes joined by spaces and bars by " | "', () => {
    const node = reparse('score 4/4\n  C4/q D4/q E4/q F4/q | G4/h A4/h |');
    const dsl = serializeScore(node);
    expect(dsl).toBe('score 4/4\n  C4/q D4/q E4/q F4/q | G4/h A4/h');
  });

  it('preserves rests with r/<duration>', () => {
    const node = reparse('score 4/4\n  r/q C4/q r/h |');
    expect(serializeScore(node)).toBe('score 4/4\n  r/q C4/q r/h');
  });

  it('preserves accidentals in pitch tokens', () => {
    const node = reparse('score 4/4\n  C#4/q Bb4/q F#5/q Eb4/q |');
    expect(serializeScore(node)).toBe('score 4/4\n  C#4/q Bb4/q F#5/q Eb4/q');
  });

  it('preserves dotted durations', () => {
    const node = reparse('score 4/4\n  C4/q. D4/e E4/h. r/q |');
    expect(serializeScore(node)).toBe('score 4/4\n  C4/q. D4/e E4/h. r/q');
  });

  it('emits bpm only when not default (100)', () => {
    const a = reparse('score 4/4');
    expect(serializeScore(a)).toBe('score 4/4');
    const b = reparse('score 4/4 bpm:120');
    expect(serializeScore(b)).toBe('score 4/4 bpm:120');
  });

  it('emits key when present', () => {
    const node = reparse('score 4/4 key:G');
    expect(serializeScore(node)).toBe('score 4/4 key:G');
  });

  it('round-trips bpm + key together', () => {
    const node = reparse('score 3/4 bpm:90 key:Bb\n  Bb4/q D5/q F5/q |');
    const dsl = serializeScore(node);
    expect(dsl).toBe('score 3/4 bpm:90 key:Bb\n  Bb4/q D5/q F5/q');
    const re = reparse(dsl);
    expect(re.timeSignature).toEqual({ beats: 3, beatValue: 4 });
    expect(re.bpm).toBe(90);
    expect(re.key).toBe('Bb');
  });
});
