import type { DrumNode, DrumTrackKey, TimeSignature } from '../ast/types.js';
import { ParseError } from './errors.js';
import type { BlockTokenized } from './tokenizer.js';

const TRACK_KEYS: ReadonlySet<DrumTrackKey> = new Set(['HH', 'SN', 'KK', 'TM', 'CR', 'RD']);

export function parseDrumBlock(t: BlockTokenized): DrumNode {
  const timeSignature: TimeSignature = t.header.timeSignature ?? { beats: 4, beatValue: 4 };
  const bpm = parseBpm(t.header.params.bpm);
  const warnings: string[] = [];

  const trackLines = t.contentLines.map((l) => l.trim()).filter((l) => l.length > 0);
  const tracks: Partial<Record<DrumTrackKey, boolean[]>> = {};
  let resolution = 0;
  let barCount = 0;

  for (const line of trackLines) {
    const firstPipe = line.indexOf('|');
    if (firstPipe === -1) {
      warnings.push(`drum line missing '|': ${line}`);
      continue;
    }
    const name = line.slice(0, firstPipe).trim() as DrumTrackKey;
    if (!TRACK_KEYS.has(name)) {
      warnings.push(`unknown drum track: ${name}`);
      continue;
    }
    const cellsPart = line.slice(firstPipe);
    const bars = cellsPart.split('|').map((s) => s.trim()).filter((s) => s.length > 0);
    const flat: boolean[] = [];
    for (const bar of bars) {
      for (const ch of bar) {
        if (ch === 'x' || ch === 'X') flat.push(true);
        else if (ch === '-') flat.push(false);
      }
    }
    if (bars.length > 0) {
      if (barCount === 0) barCount = bars.length;
      const perBar = flat.length / bars.length;
      if (resolution === 0) resolution = perBar;
      if (perBar !== resolution) {
        warnings.push(`track ${name}: inconsistent resolution (${perBar} vs ${resolution})`);
      }
    }
    tracks[name] = flat;
  }

  if (resolution === 0) {
    warnings.push('no drum cells parsed');
  }

  return { type: 'drum', timeSignature, bpm, resolution, barCount, tracks, warnings };
}

function parseBpm(raw: string | undefined): number {
  if (raw === undefined) return 100;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n) || n <= 0) throw new ParseError(`Invalid bpm: ${raw}`);
  return n;
}
