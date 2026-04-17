import type { ChordNode, InlineNode, NoteNode, ScaleNode } from '../ast/types.js';
import { parseChordSymbol } from '../theory/chords.js';
import { midiToFrequency, parsePitch, pitchToMidi } from '../theory/notes.js';
import { parseScaleLine } from '../theory/scales.js';
import { ParseError } from './errors.js';

export function parseInline(token: string): InlineNode {
  const trimmed = token.trim();
  const colon = trimmed.indexOf(':');
  if (colon === -1) throw new ParseError(`Invalid inline token (missing ':'): ${token}`);
  const type = trimmed.slice(0, colon).trim();
  const value = trimmed.slice(colon + 1).trim();
  if (!value) throw new ParseError(`Empty inline value for type '${type}'`);

  switch (type) {
    case 'chord':
      return parseInlineChord(value);
    case 'scale':
      return parseInlineScale(value);
    case 'note':
      return parseInlineNote(value);
    default:
      throw new ParseError(`Unknown inline type: ${type}`);
  }
}

function parseInlineChord(value: string): ChordNode {
  const parsed = parseChordSymbol(value);
  const node: ChordNode = {
    type: 'chord',
    symbol: parsed.symbol,
    root: parsed.root,
    quality: parsed.quality,
    intervals: parsed.intervals,
    notes: parsed.notes,
  };
  if (parsed.bass !== undefined) node.bass = parsed.bass;
  return node;
}

function parseInlineScale(value: string): ScaleNode {
  const s = parseScaleLine(value);
  return {
    type: 'scale',
    root: s.root,
    scaleType: s.scaleType,
    notes: s.notes,
    intervals: s.intervals,
  };
}

function parseInlineNote(value: string): NoteNode {
  const p = parsePitch(value);
  const midi = pitchToMidi(value);
  return {
    type: 'note',
    pitch: value,
    noteName: p.letter + (p.accidental === 1 ? '#' : p.accidental === -1 ? 'b' : ''),
    octave: p.octave,
    midiNumber: midi,
    frequency: midiToFrequency(midi),
  };
}
