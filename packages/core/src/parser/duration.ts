import type { DurationSymbol } from '../ast/types.js';
import { ParseError } from './errors.js';

// 분모 4 기준 박자값. 4/4에서 q=1박, h=2박, w=4박. 다른 분모는 (beatValue/4) 비율로 환산.
const BASE_BEATS_QUARTER: Record<string, number> = {
  w: 4,
  h: 2,
  q: 1,
  e: 0.5,
  s: 0.25,
};

// 1박 = 1/beatValue whole note 정의에 따라 duration 토큰을 박(beat) 수로 환산한다.
// 예) 4/4: q=1, h=2 — 6/8: q=2, e=1, q.=3 — 2/2: h=1, q=0.5, w=2.
export function durationToBeats(d: string, beatValue: number): number {
  if (!Number.isFinite(beatValue) || beatValue <= 0) {
    throw new ParseError(`Invalid beatValue: ${beatValue}`);
  }
  const dotted = d.endsWith('.');
  const base = dotted ? d.slice(0, -1) : d;
  const b = BASE_BEATS_QUARTER[base];
  if (b === undefined) throw new ParseError(`Invalid duration: ${d}`);
  const baseBeats = dotted ? b * 1.5 : b;
  return baseBeats * (beatValue / 4);
}

export function isDurationSymbol(d: string): d is DurationSymbol {
  const dotted = d.endsWith('.');
  const base = dotted ? d.slice(0, -1) : d;
  return base in BASE_BEATS_QUARTER;
}
