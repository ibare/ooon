import type { DurationSymbol } from '../ast/types.js';
import { ParseError } from './errors.js';

const BASE_BEATS: Record<string, number> = {
  w: 4,
  h: 2,
  q: 1,
  e: 0.5,
  s: 0.25,
};

export function durationToBeats(d: string): number {
  const dotted = d.endsWith('.');
  const base = dotted ? d.slice(0, -1) : d;
  const b = BASE_BEATS[base];
  if (b === undefined) throw new ParseError(`Invalid duration: ${d}`);
  return dotted ? b * 1.5 : b;
}

export function isDurationSymbol(d: string): d is DurationSymbol {
  const dotted = d.endsWith('.');
  const base = dotted ? d.slice(0, -1) : d;
  return base in BASE_BEATS;
}
