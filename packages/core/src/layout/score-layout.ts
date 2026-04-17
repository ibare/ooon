import type { NoteEvent, ScoreNode } from '../ast/types.js';
import { parsePitch, pitchToMidi } from '../theory/notes.js';
import { SMUFL } from '../smufl.js';
import type {
  ScoreBarLayout,
  ScoreGlyph,
  ScoreLayout,
  ScoreNoteLayout,
  ScoreStaff,
  ScoreTimeSig,
} from './types.js';

export interface ScoreLayoutOptions {
  width: number;
  staffY?: number;
  lineGap?: number;
  clefWidth?: number;
  timeSigWidth?: number;
  barPadding?: number;
}

const LETTER_STEP: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

function letterStep(letter: string, octave: number): number {
  const idx = LETTER_STEP[letter];
  if (idx === undefined) throw new Error(`Invalid letter: ${letter}`);
  return octave * 7 + idx;
}

function pitchStep(pitch: string): number {
  const p = parsePitch(pitch);
  return letterStep(p.letter, p.octave);
}

const B4_STEP = letterStep('B', 4);

export function calculateScoreLayout(node: ScoreNode, opts: ScoreLayoutOptions): ScoreLayout {
  const width = opts.width;
  const lineGap = opts.lineGap ?? 10;
  const halfStep = lineGap / 2;
  const staffTopY = (opts.staffY ?? 40) - lineGap * 2;
  const staffBottomY = staffTopY + lineGap * 4;
  const centerY = staffTopY + lineGap * 2;

  const staff: ScoreStaff = {
    y: centerY,
    top: staffTopY,
    bottom: staffBottomY,
    lineGap,
    lines: [0, 1, 2, 3, 4].map((i) => staffTopY + i * lineGap),
  };

  const clefX = 10;
  const clef: ScoreGlyph = { x: clefX, y: centerY + lineGap, glyph: SMUFL.gClef };

  const clefWidth = opts.clefWidth ?? 34;
  const timeSigX = clefX + clefWidth;
  const timeSigWidth = opts.timeSigWidth ?? 22;
  const timeSig: ScoreTimeSig = {
    x: timeSigX,
    topGlyph: SMUFL.timeSigDigit(node.timeSignature.beats),
    topY: staffTopY + lineGap,
    bottomGlyph: SMUFL.timeSigDigit(node.timeSignature.beatValue),
    bottomY: staffTopY + lineGap * 3,
  };

  const contentStart = timeSigX + timeSigWidth;
  const available = width - contentStart - 10;
  const barCount = Math.max(node.bars.length, 1);
  const barWidth = available / barCount;
  const barPadding = opts.barPadding ?? 8;

  const bars: ScoreBarLayout[] = node.bars.map((bar, barIdx) => {
    const barX = contentStart + barIdx * barWidth;
    const barlineX = barX + barWidth;
    const innerX = barX + barPadding;
    const innerWidth = barWidth - barPadding * 2;

    const totalBeats = bar.notes.reduce((s, n) => s + n.beats, 0) || node.timeSignature.beats;
    let cursorBeat = 0;

    const notes: ScoreNoteLayout[] = bar.notes.map((note, noteIdx) => {
      const noteX = innerX + (cursorBeat / totalBeats) * innerWidth;
      cursorBeat += note.beats;
      return buildNoteLayout(note, noteX, halfStep, centerY, bar.barNumber, noteIdx, staffTopY, staffBottomY, lineGap);
    });

    return { barNumber: bar.barNumber, x: barX, width: barWidth, barlineX, notes };
  });

  const height = staffBottomY + 60;
  return { width, height, staff, clef, timeSig, bars, contentStart };
}

function buildNoteLayout(
  note: NoteEvent,
  x: number,
  halfStep: number,
  centerY: number,
  barNumber: number,
  noteIndex: number,
  staffTopY: number,
  staffBottomY: number,
  lineGap: number,
): ScoreNoteLayout {
  if (note.isRest) {
    const glyph = restGlyph(note.beats);
    return {
      barNumber,
      noteIndex,
      x,
      y: centerY,
      headGlyph: glyph,
      beats: note.beats,
      isRest: true,
      pitch: '',
      midi: -1,
      dots: dotsForBeats(note.beats, x + 10, centerY - halfStep),
      ledgerLines: [],
    };
  }

  const parsed = parsePitch(note.pitch);
  const midi = pitchToMidi(note.pitch);
  const step = letterStep(parsed.letter, parsed.octave);
  const y = centerY + (B4_STEP - step) * halfStep;

  const headGlyph = noteheadGlyph(note.beats);
  const stemDown = step >= B4_STEP;
  const stemLen = lineGap * 3.5;
  const stem: ScoreNoteLayout['stem'] =
    note.beats >= 4
      ? undefined
      : stemDown
        ? { x: x - 0.5, y1: y, y2: y + stemLen }
        : { x: x + 5.5, y1: y, y2: y - stemLen };

  let flag: ScoreGlyph | undefined;
  if (note.beats === 0.5 || note.beats === 0.75) {
    const fx = stem ? stem.x : x;
    const fy = stemDown ? (stem?.y2 ?? y) : (stem?.y2 ?? y);
    flag = { x: fx, y: fy, glyph: stemDown ? SMUFL.flag8thDown : SMUFL.flag8thUp };
  } else if (note.beats === 0.25 || note.beats === 0.375) {
    const fx = stem ? stem.x : x;
    const fy = stem?.y2 ?? y;
    flag = { x: fx, y: fy, glyph: stemDown ? SMUFL.flag16thDown : SMUFL.flag16thUp };
  }

  let accidental: ScoreGlyph | undefined;
  if (parsed.accidental === 1) {
    accidental = { x: x - 12, y, glyph: SMUFL.accidentalSharp };
  } else if (parsed.accidental === -1) {
    accidental = { x: x - 12, y, glyph: SMUFL.accidentalFlat };
  }

  const ledgerLines = calcLedgerLines(y, staffTopY, staffBottomY, lineGap, x);

  const out: ScoreNoteLayout = {
    barNumber,
    noteIndex,
    x,
    y,
    headGlyph,
    beats: note.beats,
    isRest: false,
    pitch: note.pitch,
    midi,
    dots: dotsForBeats(note.beats, x + 10, y - halfStep),
    ledgerLines,
  };
  if (stem) out.stem = stem;
  if (flag) out.flag = flag;
  if (accidental) out.accidental = accidental;
  return out;
}

function noteheadGlyph(beats: number): string {
  if (beats >= 4) return SMUFL.noteheadWhole;
  if (beats >= 2) return SMUFL.noteheadHalf;
  return SMUFL.noteheadBlack;
}

function restGlyph(beats: number): string {
  if (beats >= 4) return SMUFL.restWhole;
  if (beats >= 2) return SMUFL.restHalf;
  if (beats >= 1) return SMUFL.restQuarter;
  if (beats >= 0.5) return SMUFL.rest8th;
  return SMUFL.rest16th;
}

function dotsForBeats(beats: number, x: number, y: number): { x: number; y: number }[] {
  const integer = Math.floor(beats);
  const remainder = beats - integer;
  if (Math.abs(remainder - integer * 0.5) < 0.001 && integer > 0) {
    return [{ x, y }];
  }
  return [];
}

function calcLedgerLines(
  noteY: number,
  staffTop: number,
  staffBottom: number,
  lineGap: number,
  x: number,
): { x1: number; x2: number; y: number }[] {
  const lines: { x1: number; x2: number; y: number }[] = [];
  const extent = 8;
  if (noteY < staffTop) {
    let y = staffTop - lineGap;
    while (y >= noteY - lineGap / 2) {
      lines.push({ x1: x - extent, x2: x + extent, y });
      y -= lineGap;
    }
  } else if (noteY > staffBottom) {
    let y = staffBottom + lineGap;
    while (y <= noteY + lineGap / 2) {
      lines.push({ x1: x - extent, x2: x + extent, y });
      y += lineGap;
    }
  }
  return lines;
}
