import type { ChordEventResolved, ProgressionBar, ProgressionNode, TimeSignature } from '../ast/types.js';
import { resolveRoman, type Mode } from '../theory/roman.js';
import { ParseError } from './errors.js';
import type { BlockTokenized } from './tokenizer.js';

export function parseProgressionBlock(t: BlockTokenized): ProgressionNode {
  const timeSignature: TimeSignature = t.header.timeSignature ?? { beats: 4, beatValue: 4 };
  const bpm = parseBpm(t.header.params.bpm);
  const inKey = t.header.params.in;
  if (!inKey) throw new ParseError('progression: missing "in:" parameter');

  const { key, mode } = splitKey(inKey);
  const warnings: string[] = [];

  const content = t.contentLines.join(' ').trim();
  const barStrings = content.split('|').map((s) => s.trim()).filter((s) => s.length > 0);

  const bars: ProgressionBar[] = barStrings.map((barStr, idx) => {
    const tokens = barStr.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
    const beatsPerChord = timeSignature.beats / Math.max(tokens.length, 1);
    const chords: ChordEventResolved[] = tokens.map((raw) => {
      const r = resolveRoman(raw, key, mode);
      return {
        roman: raw,
        symbol: r.symbol,
        beats: beatsPerChord,
        root: r.root,
        quality: r.quality,
        notes: r.notes,
      };
    });
    return { barNumber: idx + 1, chords };
  });

  return { type: 'progression', timeSignature, key, mode, bpm, bars, warnings };
}

function splitKey(input: string): { key: string; mode: Mode } {
  const m = /^([A-G][#b]?)(m?)$/.exec(input.trim());
  if (!m) throw new ParseError(`Invalid key: ${input}`);
  const root = m[1] ?? '';
  const isMinor = m[2] === 'm';
  return { key: root, mode: isMinor ? 'minor' : 'major' };
}

function parseBpm(raw: string | undefined): number {
  if (raw === undefined) return 100;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n) || n <= 0) throw new ParseError(`Invalid bpm: ${raw}`);
  return n;
}
