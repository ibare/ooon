import { noteName, parsePitch, pitchClassOf } from './notes.js';

export interface ChordQuality {
  symbol: string;
  intervals: readonly number[];
}

export const CHORD_QUALITIES: readonly ChordQuality[] = [
  { symbol: 'maj7', intervals: [0, 4, 7, 11] },
  { symbol: 'm7b5', intervals: [0, 3, 6, 10] },
  { symbol: 'dim7', intervals: [0, 3, 6, 9] },
  { symbol: 'sus4', intervals: [0, 5, 7] },
  { symbol: 'sus2', intervals: [0, 2, 7] },
  { symbol: 'add9', intervals: [0, 4, 7, 14] },
  { symbol: 'm6', intervals: [0, 3, 7, 9] },
  { symbol: 'm7', intervals: [0, 3, 7, 10] },
  { symbol: 'dim', intervals: [0, 3, 6] },
  { symbol: 'aug', intervals: [0, 4, 8] },
  { symbol: '9', intervals: [0, 4, 7, 10, 14] },
  { symbol: '6', intervals: [0, 4, 7, 9] },
  { symbol: '7', intervals: [0, 4, 7, 10] },
  { symbol: 'm', intervals: [0, 3, 7] },
  { symbol: '', intervals: [0, 4, 7] },
];

export class ChordParseError extends Error {
  constructor(input: string) {
    super(`Invalid chord symbol: ${input}`);
    this.name = 'ChordParseError';
  }
}

export interface ParsedChord {
  symbol: string;
  root: string;
  quality: string;
  intervals: readonly number[];
  notes: readonly string[];
  bass?: string;
}

const ROOT_RE = /^([A-G])([#b]?)/;

export function parseChordSymbol(raw: string): ParsedChord {
  const input = raw.trim();
  if (!input) throw new ChordParseError(raw);

  const [main, bassRaw] = input.split('/');
  if (main === undefined) throw new ChordParseError(raw);

  const rootMatch = ROOT_RE.exec(main);
  if (!rootMatch) throw new ChordParseError(raw);
  const root = (rootMatch[1] ?? '') + (rootMatch[2] ?? '');
  const remainder = main.slice(root.length);

  const quality = CHORD_QUALITIES.find((q) => q.symbol === remainder);
  if (!quality) throw new ChordParseError(raw);

  const rootPc = pitchClassOf(root);
  const useFlats = root.includes('b');
  const notes = quality.intervals.map((semi) => noteName((rootPc + semi) % 12, useFlats));

  const parsed: ParsedChord = {
    symbol: input,
    root,
    quality: quality.symbol,
    intervals: quality.intervals,
    notes,
  };
  if (bassRaw && bassRaw.length > 0) {
    parsePitch(bassRaw);
    parsed.bass = bassRaw;
  }
  return parsed;
}

export function chordVoicing(chord: ParsedChord, rootMidi: number): number[] {
  return chord.intervals.map((semi) => rootMidi + semi);
}
