import type {
  DrumTrackKey,
  NoteEvent,
  SongBar,
  SongNode,
  TimeSignature,
} from '../ast/types.js';
import { BEAT_CATALOG } from '../catalog/beats.js';
import { parseChordSymbol } from '../theory/chords.js';
import { parsePitch } from '../theory/notes.js';
import { durationToBeats, isDurationSymbol } from './duration.js';
import { ParseError } from './errors.js';
import type { BlockTokenized } from './tokenizer.js';

const NOTE_RE = /^([A-Ga-gr])([#b]?)(-?\d+)?\/([whqes]\.?)$/;
const CHORD_HINT_RE = /^[A-G][#b]?/;

function looksLikeChordToken(t: string): boolean {
  return CHORD_HINT_RE.test(t) && !NOTE_RE.test(t);
}

function parseNoteToken(token: string, beatValue: number): NoteEvent {
  const m = NOTE_RE.exec(token);
  if (!m) throw new ParseError(`Invalid note token: ${token}`);
  const letter = m[1];
  const acc = m[2] ?? '';
  const oct = m[3];
  const dur = m[4];
  if (!letter || !dur || !isDurationSymbol(dur)) {
    throw new ParseError(`Invalid note token: ${token}`);
  }
  const beats = durationToBeats(dur, beatValue);
  const isRest = letter.toLowerCase() === 'r';
  if (isRest) return { pitches: [], duration: dur, beats, isRest: true };
  const octStr = oct !== undefined ? oct : '4';
  const pitch = letter.toUpperCase() + acc + octStr;
  parsePitch(pitch);
  return { pitches: [pitch], duration: dur, beats, isRest: false };
}

export function parseSongBlock(t: BlockTokenized): SongNode {
  const timeSignature: TimeSignature = t.header.timeSignature ?? { beats: 4, beatValue: 4 };
  const bpm = parseBpm(t.header.params.bpm);
  const key = t.header.params.key ?? 'C';
  const warnings: string[] = [];

  const lines = t.contentLines.map((l) => l.trim()).filter((l) => l.length > 0);
  let beat: string | undefined;
  const bodyLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith('beat:')) {
      beat = line.slice('beat:'.length).trim();
    } else {
      bodyLines.push(line);
    }
  }

  const chordLineIdx = bodyLines.findIndex((l) => classifyLine(l) === 'chord');
  const melodyLineIdx = bodyLines.findIndex((l) => classifyLine(l) === 'melody');

  if (chordLineIdx === -1) throw new ParseError('song: no chord line detected');
  if (melodyLineIdx === -1) throw new ParseError('song: no melody line detected');

  const chordLine = bodyLines[chordLineIdx] as string;
  const melodyLine = bodyLines[melodyLineIdx] as string;
  const chordBars = splitBars(chordLine);
  const melodyBars = splitBars(melodyLine);

  if (chordBars.length !== melodyBars.length) {
    warnings.push(
      `song: bar count mismatch (chord=${chordBars.length}, melody=${melodyBars.length})`,
    );
  }

  const barCount = Math.min(chordBars.length, melodyBars.length);
  const beatPattern = beat ? BEAT_CATALOG[beat] : undefined;
  if (beat && !beatPattern) warnings.push(`song: unknown beat '${beat}'`);

  const bars: SongBar[] = [];
  for (let i = 0; i < barCount; i++) {
    const chordBarRaw = chordBars[i] ?? '';
    const melodyBarRaw = melodyBars[i] ?? '';

    const chordToken = chordBarRaw.split(/\s+/).find((s) => s.length > 0) ?? '';
    const parsedChord = parseChordSymbol(chordToken);

    const melodyTokens = melodyBarRaw.split(/\s+/).filter((s) => s.length > 0);
    const melody = melodyTokens.map((tok) => parseNoteToken(tok, timeSignature.beatValue));
    const melodyTotal = melody.reduce((sum, n) => sum + n.beats, 0);
    const expected = timeSignature.beats;
    if (melodyTotal < expected) {
      melody.push({ pitches: [], duration: 'q', beats: expected - melodyTotal, isRest: true });
      warnings.push(`song bar ${i + 1}: melody padded with rest`);
    } else if (melodyTotal > expected) {
      warnings.push(`song bar ${i + 1}: melody overflow`);
    }

    const bar: SongBar = {
      barNumber: i + 1,
      chord: { ...parsedChord, beats: expected },
      melody,
    };
    if (beatPattern) {
      const tracks: Partial<Record<DrumTrackKey, boolean[]>> = {};
      for (const [k, pat] of Object.entries(beatPattern.tracks)) {
        tracks[k as DrumTrackKey] = patternToCells(pat);
      }
      bar.drum = tracks;
    }
    bars.push(bar);
  }

  const node: SongNode = {
    type: 'song',
    timeSignature,
    key,
    bpm,
    barCount,
    bars,
    warnings,
  };
  if (beat !== undefined) node.beat = beat;
  return node;
}

function classifyLine(line: string): 'chord' | 'melody' | 'unknown' {
  const inside = line.replace(/\|/g, ' ').trim();
  const tokens = inside.split(/\s+/).filter((s) => s.length > 0);
  if (tokens.length === 0) return 'unknown';
  const noteLike = tokens.filter((t) => NOTE_RE.test(t)).length;
  const chordLike = tokens.filter((t) => looksLikeChordToken(t)).length;
  if (noteLike > chordLike) return 'melody';
  if (chordLike > 0) return 'chord';
  return 'unknown';
}

function splitBars(line: string): string[] {
  return line.split('|').map((s) => s.trim()).filter((s) => s.length > 0);
}

function patternToCells(pat: string): boolean[] {
  const cells: boolean[] = [];
  for (const ch of pat) {
    if (ch === 'x' || ch === 'X') cells.push(true);
    else if (ch === '-') cells.push(false);
  }
  return cells;
}

function parseBpm(raw: string | undefined): number {
  if (raw === undefined) return 100;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n) || n <= 0) throw new ParseError(`Invalid bpm: ${raw}`);
  return n;
}
