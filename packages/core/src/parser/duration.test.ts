import { describe, expect, it } from 'vitest';
import { durationToBeats, isDurationSymbol } from './duration.js';
import { ParseError } from './errors.js';

describe('durationToBeats', () => {
  // 1박 = 1/beatValue whole note. beatValue=4(분모 4) 기준 quarter가 1박.
  describe('beatValue=4 (분모 4)', () => {
    it('w=4, h=2, q=1, e=0.5, s=0.25', () => {
      expect(durationToBeats('w', 4)).toBe(4);
      expect(durationToBeats('h', 4)).toBe(2);
      expect(durationToBeats('q', 4)).toBe(1);
      expect(durationToBeats('e', 4)).toBe(0.5);
      expect(durationToBeats('s', 4)).toBe(0.25);
    });

    it('점음표는 1.5배', () => {
      expect(durationToBeats('h.', 4)).toBe(3);
      expect(durationToBeats('q.', 4)).toBe(1.5);
      expect(durationToBeats('e.', 4)).toBe(0.75);
    });
  });

  // 6/8: 1박 = eighth note. q=2박, e=1박, q.=3박, w=8박.
  describe('beatValue=8 (분모 8 — 6/8 등 컴파운드)', () => {
    it('q=2, e=1, s=0.5, h=4, w=8', () => {
      expect(durationToBeats('q', 8)).toBe(2);
      expect(durationToBeats('e', 8)).toBe(1);
      expect(durationToBeats('s', 8)).toBe(0.5);
      expect(durationToBeats('h', 8)).toBe(4);
      expect(durationToBeats('w', 8)).toBe(8);
    });

    it('점음표: q.=3, e.=1.5', () => {
      expect(durationToBeats('q.', 8)).toBe(3);
      expect(durationToBeats('e.', 8)).toBe(1.5);
    });
  });

  // 2/2 (cut time): 1박 = half note. h=1박, q=0.5박, w=2박.
  describe('beatValue=2 (분모 2 — cut time)', () => {
    it('h=1, q=0.5, e=0.25, w=2', () => {
      expect(durationToBeats('h', 2)).toBe(1);
      expect(durationToBeats('q', 2)).toBe(0.5);
      expect(durationToBeats('e', 2)).toBe(0.25);
      expect(durationToBeats('w', 2)).toBe(2);
    });
  });

  it('잘못된 duration 토큰은 ParseError', () => {
    expect(() => durationToBeats('z', 4)).toThrow(ParseError);
  });

  it('beatValue가 0 이하면 ParseError', () => {
    expect(() => durationToBeats('q', 0)).toThrow(ParseError);
    expect(() => durationToBeats('q', -4)).toThrow(ParseError);
  });
});

describe('isDurationSymbol', () => {
  it('기본 + 점 변형 인식', () => {
    expect(isDurationSymbol('w')).toBe(true);
    expect(isDurationSymbol('h.')).toBe(true);
    expect(isDurationSymbol('q')).toBe(true);
    expect(isDurationSymbol('s.')).toBe(true);
  });

  it('알 수 없는 토큰은 false', () => {
    expect(isDurationSymbol('z')).toBe(false);
    expect(isDurationSymbol('')).toBe(false);
    expect(isDurationSymbol('q..')).toBe(false);
  });
});
