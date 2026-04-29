import { type Sp, type GlyphName } from '@oon/smufl-asset';
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
import { parseKeySignature } from './passes/key-signature.js';
import { resolveAccidentals, type AccidentalKind } from './passes/accidentals.js';
import { ledgerLines, noteY as verticalNoteY } from './passes/vertical.js';
import { placeStem, stemDirection } from './passes/stem.js';

export interface ScoreLayoutOptions {
  width: number;
  staffY?: number;
  lineGap?: number;
  clefWidth?: number;
  timeSigWidth?: number;
  barPadding?: number;
}

const sp = (n: number): Sp => n as Sp;

// ─────────────────────────────────────────────────────────────────────────────
// 단위 규약
// ─────────────────────────────────────────────────────────────────────────────
// SMuFL 명세대로 staff space(sp)를 단위로 한다. 1 sp = 보표 한 칸.
// 본 모듈은 layout 결과를 px로 반환하므로 마지막 단계에서만 `pxPerSp`를 곱한다.
// `pxPerSp`는 옵션으로 받은 `lineGap`(보표 한 칸의 px 크기)과 동일하다.

// ─────────────────────────────────────────────────────────────────────────────
// 수직 배치 상수 (sp)
// ─────────────────────────────────────────────────────────────────────────────
const STAFF_HALF_HEIGHT_SP = sp(2); // 보표 가운데에서 위/아래 끝까지 2 sp
const STAFF_HEIGHT_SP = sp(4); // 보표 전체 높이 4 sp (5선 4칸)
const STEM_LENGTH_SP = sp(3.5); // 표준 stem 길이

// ─────────────────────────────────────────────────────────────────────────────
// 수평 배치 상수 (sp) — 본 단계에서는 추정치. S4에서 글리프 advanceWidth로 대체.
// ─────────────────────────────────────────────────────────────────────────────
const CLEF_LEFT_PAD_SP = sp(1.0); // 보표 좌단 → 음자리표 시작
const CLEF_WIDTH_SP = sp(3.4); // 음자리표 영역 폭
const TIMESIG_WIDTH_SP = sp(2.2); // 시간기호 영역 폭
const BAR_INNER_PAD_SP = sp(0.8); // 마디 안쪽 좌우 여백
const RIGHT_MARGIN_SP = sp(1.0); // 보표 우단 여백
const HEIGHT_PADDING_SP = sp(6.0); // 보표 아래 여유 높이 (음표 이름 등)
const DOT_X_OFFSET_SP = sp(1.0); // augmentation dot의 x 거리
const ACCIDENTAL_X_OFFSET_SP = sp(1.2); // 임시표 → 머리 좌측 거리

// 정렬용 step 계산
const LETTER_STEP: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

function letterStep(letter: string, octave: number): number {
  const idx = LETTER_STEP[letter];
  if (idx === undefined) throw new Error(`Invalid letter: ${letter}`);
  return octave * 7 + idx;
}

const B4_STEP = letterStep('B', 4);

function accidentalGlyph(kind: AccidentalKind): string | null {
  switch (kind) {
    case 'sharp':
      return SMUFL.accidentalSharp;
    case 'flat':
      return SMUFL.accidentalFlat;
    case 'natural':
      return SMUFL.accidentalNatural;
    case 'doubleSharp':
      return SMUFL.accidentalDoubleSharp;
    case 'doubleFlat':
      return SMUFL.accidentalDoubleFlat;
    default:
      return null;
  }
}

export function calculateScoreLayout(node: ScoreNode, opts: ScoreLayoutOptions): ScoreLayout {
  const width = opts.width;
  const pxPerSp = opts.lineGap ?? 10;
  const lineGap = pxPerSp;

  const halfStepPx = 0.5 * pxPerSp;
  const staffTopY = (opts.staffY ?? 40) - STAFF_HALF_HEIGHT_SP * pxPerSp;
  const staffBottomY = staffTopY + STAFF_HEIGHT_SP * pxPerSp;
  const centerY = staffTopY + STAFF_HALF_HEIGHT_SP * pxPerSp;

  const staff: ScoreStaff = {
    y: centerY,
    top: staffTopY,
    bottom: staffBottomY,
    lineGap,
    lines: [0, 1, 2, 3, 4].map((i) => staffTopY + i * pxPerSp),
  };

  const clefX = CLEF_LEFT_PAD_SP * pxPerSp;
  const clef: ScoreGlyph = { x: clefX, y: centerY + pxPerSp, glyph: SMUFL.gClef };

  const clefWidthPx = opts.clefWidth ?? CLEF_WIDTH_SP * pxPerSp;
  const timeSigX = clefX + clefWidthPx;
  const timeSigWidthPx = opts.timeSigWidth ?? TIMESIG_WIDTH_SP * pxPerSp;
  const timeSig: ScoreTimeSig = {
    x: timeSigX,
    topGlyph: SMUFL.timeSigDigit(node.timeSignature.beats),
    topY: staffTopY + pxPerSp,
    bottomGlyph: SMUFL.timeSigDigit(node.timeSignature.beatValue),
    bottomY: staffTopY + pxPerSp * 3,
  };

  const contentStart = timeSigX + timeSigWidthPx;
  const available = width - contentStart - RIGHT_MARGIN_SP * pxPerSp;
  const barCount = Math.max(node.bars.length, 1);
  const barWidth = available / barCount;
  const barPaddingPx = opts.barPadding ?? BAR_INNER_PAD_SP * pxPerSp;

  const keySig = parseKeySignature(node.key);

  const verticalCtx = {
    centerY,
    staffTopY,
    staffBottomY,
    pxPerSp,
    b4Step: B4_STEP,
  };
  const stemCtx = { pxPerSp, stemLengthSp: STEM_LENGTH_SP };

  const bars: ScoreBarLayout[] = node.bars.map((bar, barIdx) => {
    const barX = contentStart + barIdx * barWidth;
    const barlineX = barX + barWidth;
    const innerX = barX + barPaddingPx;
    const innerWidth = barWidth - barPaddingPx * 2;

    const totalBeats = bar.notes.reduce((s, n) => s + n.beats, 0) || node.timeSignature.beats;
    const accidentalDecisions = resolveAccidentals(bar.notes, keySig);
    let cursorBeat = 0;

    const notes: ScoreNoteLayout[] = bar.notes.map((note, noteIdx) => {
      const noteX = innerX + (cursorBeat / totalBeats) * innerWidth;
      cursorBeat += note.beats;
      const decision = accidentalDecisions[noteIdx];
      return buildNoteLayout({
        note,
        x: noteX,
        halfStepPx,
        bar: bar.barNumber,
        noteIdx,
        verticalCtx,
        stemCtx,
        accidentalKind: decision?.kind ?? null,
        pxPerSp,
      });
    });

    return { barNumber: bar.barNumber, x: barX, width: barWidth, barlineX, notes };
  });

  const height = staffBottomY + HEIGHT_PADDING_SP * pxPerSp;
  return { width, height, staff, clef, timeSig, bars, contentStart };
}

interface BuildNoteArgs {
  note: NoteEvent;
  x: number;
  halfStepPx: number;
  bar: number;
  noteIdx: number;
  verticalCtx: {
    centerY: number;
    staffTopY: number;
    staffBottomY: number;
    pxPerSp: number;
    b4Step: number;
  };
  stemCtx: { pxPerSp: number; stemLengthSp: number };
  accidentalKind: AccidentalKind;
  pxPerSp: number;
}

function buildNoteLayout(args: BuildNoteArgs): ScoreNoteLayout {
  const { note, x, halfStepPx, bar, noteIdx, verticalCtx, stemCtx, accidentalKind, pxPerSp } =
    args;

  if (note.isRest) {
    const glyph = restGlyph(note.beats);
    return {
      barNumber: bar,
      noteIndex: noteIdx,
      x,
      y: verticalCtx.centerY,
      headGlyph: glyph,
      beats: note.beats,
      isRest: true,
      pitch: '',
      midi: -1,
      dots: dotsForBeats(note.beats, x + DOT_X_OFFSET_SP * pxPerSp, verticalCtx.centerY - halfStepPx),
      ledgerLines: [],
    };
  }

  const parsed = parsePitch(note.pitch);
  const midi = pitchToMidi(note.pitch);
  const step = letterStep(parsed.letter, parsed.octave);
  const y = verticalNoteY(step, verticalCtx);

  const headName = noteheadName(note.beats);
  const headGlyph = SMUFL[headName];
  const stem: ScoreNoteLayout['stem'] =
    note.beats >= 4
      ? undefined
      : (() => {
          const dir = stemDirection(step, verticalCtx.b4Step);
          const placement = placeStem(headName, x, y, dir, stemCtx);
          return { x: placement.x, y1: placement.y1, y2: placement.y2 };
        })();

  let flag: ScoreGlyph | undefined;
  if (note.beats === 0.5 || note.beats === 0.75) {
    const fx = stem ? stem.x : x;
    const fy = stem?.y2 ?? y;
    const stemDown = step >= verticalCtx.b4Step;
    flag = { x: fx, y: fy, glyph: stemDown ? SMUFL.flag8thDown : SMUFL.flag8thUp };
  } else if (note.beats === 0.25 || note.beats === 0.375) {
    const fx = stem ? stem.x : x;
    const fy = stem?.y2 ?? y;
    const stemDown = step >= verticalCtx.b4Step;
    flag = { x: fx, y: fy, glyph: stemDown ? SMUFL.flag16thDown : SMUFL.flag16thUp };
  }

  const accGlyph = accidentalGlyph(accidentalKind);
  const accidental: ScoreGlyph | undefined = accGlyph
    ? { x: x - ACCIDENTAL_X_OFFSET_SP * pxPerSp, y, glyph: accGlyph }
    : undefined;

  const ll = ledgerLines(y, x, verticalCtx);

  const out: ScoreNoteLayout = {
    barNumber: bar,
    noteIndex: noteIdx,
    x,
    y,
    headGlyph,
    beats: note.beats,
    isRest: false,
    pitch: note.pitch,
    midi,
    dots: dotsForBeats(note.beats, x + DOT_X_OFFSET_SP * pxPerSp, y - halfStepPx),
    ledgerLines: ll,
  };
  if (stem) out.stem = stem;
  if (flag) out.flag = flag;
  if (accidental) out.accidental = accidental;
  return out;
}

function noteheadName(beats: number): GlyphName & ('noteheadWhole' | 'noteheadHalf' | 'noteheadBlack') {
  if (beats >= 4) return 'noteheadWhole';
  if (beats >= 2) return 'noteheadHalf';
  return 'noteheadBlack';
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
