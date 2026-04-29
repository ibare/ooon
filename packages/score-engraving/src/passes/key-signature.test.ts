import { describe, expect, it } from 'vitest';
import { parseKeySignature } from './key-signature.js';

describe('parseKeySignature', () => {
  it('C major는 모든 letter가 0', () => {
    const k = parseKeySignature('C');
    expect(k).toEqual({ C: 0, D: 0, E: 0, F: 0, G: 0, A: 0, B: 0 });
  });

  it('G major는 F#만 1', () => {
    const k = parseKeySignature('G');
    expect(k.F).toBe(1);
    expect(k.C).toBe(0);
  });

  it('D major는 F#, C#만 1', () => {
    const k = parseKeySignature('D');
    expect(k.F).toBe(1);
    expect(k.C).toBe(1);
    expect(k.G).toBe(0);
  });

  it('F major는 Bb만 -1', () => {
    const k = parseKeySignature('F');
    expect(k.B).toBe(-1);
    expect(k.E).toBe(0);
  });

  it('Bb major는 Bb, Eb', () => {
    const k = parseKeySignature('Bb');
    expect(k.B).toBe(-1);
    expect(k.E).toBe(-1);
    expect(k.A).toBe(0);
  });

  it('A minor는 평행 메이저 C와 동일', () => {
    expect(parseKeySignature('Am')).toEqual(parseKeySignature('C'));
  });

  it('E minor는 G major와 동일', () => {
    expect(parseKeySignature('Em')).toEqual(parseKeySignature('G'));
  });

  it('F# minor는 A major와 동일', () => {
    expect(parseKeySignature('F#m')).toEqual(parseKeySignature('A'));
  });

  it('알 수 없는 키는 빈 alteration', () => {
    expect(parseKeySignature('Xyz')).toEqual({ C: 0, D: 0, E: 0, F: 0, G: 0, A: 0, B: 0 });
    expect(parseKeySignature(undefined)).toEqual({
      C: 0,
      D: 0,
      E: 0,
      F: 0,
      G: 0,
      A: 0,
      B: 0,
    });
  });
});
