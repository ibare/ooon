import type { FretDot, FretboardNode } from '../ast/types.js';
import { midiToPitch, noteName, pitchClassOf, pitchToMidi } from '../theory/notes.js';
import { buildScale, parseScaleType, type ScaleType } from '../theory/scales.js';
import { ParseError } from './errors.js';
import type { BlockTokenized } from './tokenizer.js';

const STANDARD_TUNING_MIDI: number[] = [
  pitchToMidi('E4'),
  pitchToMidi('B3'),
  pitchToMidi('G3'),
  pitchToMidi('D3'),
  pitchToMidi('A2'),
  pitchToMidi('E2'),
];

export function parseFretboardBlock(t: BlockTokenized): FretboardNode {
  if (t.header.positional.length < 2) {
    throw new ParseError('fretboard: expected at least "<root> <scaleType...>"');
  }
  const root = t.header.positional[0];
  if (root === undefined) throw new ParseError('fretboard: missing root');
  const scaleText = t.header.positional.slice(1).join(' ');
  const scaleType: ScaleType = parseScaleType(scaleText);
  const scale = buildScale(root, scaleType);

  const position = t.header.params.position
    ? Number.parseInt(t.header.params.position, 10)
    : undefined;
  const fretRange = parseFretRange(t.header.params.frets);
  const tuning = parseTuning(t.header.params.tuning);

  const scalePcs = new Set(scale.notes.map((n) => pitchClassOf(n)));
  const rootPc = pitchClassOf(root);

  const dots: FretDot[] = [];
  for (let s = 0; s < tuning.length; s++) {
    const openMidi = tuning[s];
    if (openMidi === undefined) continue;
    for (let f = fretRange[0]; f <= fretRange[1]; f++) {
      const midi = openMidi + f;
      const pc = ((midi % 12) + 12) % 12;
      if (!scalePcs.has(pc)) continue;
      const pitch = midiToPitch(midi);
      const letter = noteName(pc);
      dots.push({ string: s, fret: f, note: letter, isRoot: pc === rootPc, midiNote: midi });
      void pitch;
    }
  }

  const node: FretboardNode = {
    type: 'fretboard',
    scale: { root, scaleType, notes: scale.notes },
    fretRange,
    tuning,
    dots,
  };
  if (position !== undefined) node.position = position;
  return node;
}

function parseFretRange(raw: string | undefined): [number, number] {
  if (!raw) return [0, 12];
  const m = /^(\d+)-(\d+)$/.exec(raw);
  if (!m) throw new ParseError(`Invalid frets range: ${raw}`);
  const low = Number.parseInt(m[1] ?? '0', 10);
  const high = Number.parseInt(m[2] ?? '0', 10);
  if (low > high) throw new ParseError(`Invalid frets range (low > high): ${raw}`);
  return [low, high];
}

function parseTuning(raw: string | undefined): number[] {
  if (!raw || raw === 'standard') return [...STANDARD_TUNING_MIDI];
  const parts = raw.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
  if (parts.length === 0) throw new ParseError(`Invalid tuning: ${raw}`);
  return parts.map((p) => pitchToMidi(p));
}
