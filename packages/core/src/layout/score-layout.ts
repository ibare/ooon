import { ENGRAVING, GLYPHS, type Sp, type GlyphName } from '@oon/smufl-asset';
import type { NoteEvent, ScoreNode } from '../ast/types.js';
import { parsePitch, pitchToMidi } from '../theory/notes.js';
import { SMUFL } from '../smufl.js';
import type {
  ScoreBarLayout,
  ScoreBeam,
  ScoreBeamLine,
  ScoreGlyph,
  ScoreLayout,
  ScoreNoteLayout,
  ScoreStaff,
  ScoreTimeSig,
} from './types.js';
import {
  parseKeySignature,
  SHARPS_ORDER,
  FLATS_ORDER,
  type KeySignatureMap,
} from './passes/key-signature.js';
import { resolveAccidentals, type AccidentalKind } from './passes/accidentals.js';
import { ledgerLines, noteY as verticalNoteY } from './passes/vertical.js';
import { placeStem, stemDirection } from './passes/stem.js';
import {
  defaultClefWidthSp,
  defaultTimeSigWidthSp,
  distributeNotes,
  noteRequiredWidth,
} from './passes/spacing.js';
import { groupBeams, type BeamGroup } from './passes/beams.js';

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
// 수평 배치 상수 (sp). clefWidth/timeSigWidth는 spacing pass의 메타데이터 기반
// 기본값을 사용하고, 사용자가 옵션으로 override할 수 있다.
// ─────────────────────────────────────────────────────────────────────────────
const CLEF_LEFT_PAD_SP = sp(1.0); // 보표 좌단 → 음자리표 시작
const BAR_INNER_PAD_SP = sp(0.8); // 마디 안쪽 좌우 여백
const RIGHT_MARGIN_SP = sp(1.0); // 보표 우단 여백
const HEIGHT_PADDING_SP = sp(6.0); // 보표 아래 여유 높이 (음표 이름 등)
const DOT_GAP_SP = sp(0.25); // augmentation dot ↔ notehead 우측 끝 사이 간격
const ACCIDENTAL_X_OFFSET_SP = sp(1.2); // 임시표 → 머리 좌측 거리
const KEY_SIG_LEFT_PAD_SP = sp(0.4); // 음자리표 끝 → 첫 키사인 글리프
const KEY_SIG_GLYPH_GAP_SP = sp(0.1); // 키사인 글리프 간 여백
const KEY_SIG_RIGHT_PAD_SP = sp(0.6); // 마지막 키사인 → 박자표

// 정렬용 step 계산
const LETTER_STEP: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

function letterStep(letter: string, octave: number): number {
  const idx = LETTER_STEP[letter];
  if (idx === undefined) throw new Error(`Invalid letter: ${letter}`);
  return octave * 7 + idx;
}

const B4_STEP = letterStep('B', 4);

// 표준 treble 조표 위치(샤프/플랫 각 7개 순서 — F#,C#,...; Bb,Eb,...).
const SHARP_KEY_STEPS: readonly number[] = [
  letterStep('F', 5),
  letterStep('C', 5),
  letterStep('G', 5),
  letterStep('D', 5),
  letterStep('A', 4),
  letterStep('E', 5),
  letterStep('B', 4),
];
const FLAT_KEY_STEPS: readonly number[] = [
  letterStep('B', 4),
  letterStep('E', 5),
  letterStep('A', 4),
  letterStep('D', 5),
  letterStep('G', 4),
  letterStep('C', 5),
  letterStep('F', 4),
];

interface KeySigVerticalCtx {
  centerY: number;
  staffTopY: number;
  staffBottomY: number;
  pxPerSp: number;
  b4Step: number;
}

function buildKeySig(
  map: KeySignatureMap,
  startX: number,
  ctx: KeySigVerticalCtx,
  pxPerSp: number,
): { glyphs: ScoreGlyph[]; width: number } {
  let sharpCount = 0;
  for (const l of SHARPS_ORDER) {
    if (map[l] === 1) sharpCount += 1;
  }
  let flatCount = 0;
  for (const l of FLATS_ORDER) {
    if (map[l] === -1) flatCount += 1;
  }
  const isFlats = flatCount > 0 && sharpCount === 0;
  const count = isFlats ? flatCount : sharpCount;
  if (count === 0) return { glyphs: [], width: 0 };

  const positions = isFlats ? FLAT_KEY_STEPS : SHARP_KEY_STEPS;
  const glyphChar = isFlats ? SMUFL.accidentalFlat : SMUFL.accidentalSharp;
  const glyphInfo = isFlats ? GLYPHS.accidentalFlat : GLYPHS.accidentalSharp;
  const stepPerGlyphPx = (glyphInfo.advanceWidth + KEY_SIG_GLYPH_GAP_SP) * pxPerSp;
  const leftPadPx = KEY_SIG_LEFT_PAD_SP * pxPerSp;

  const glyphs: ScoreGlyph[] = [];
  for (let i = 0; i < count; i += 1) {
    const step = positions[i]!;
    const y = verticalNoteY(step, ctx);
    const x = startX + leftPadPx + i * stepPerGlyphPx;
    glyphs.push({ x, y, glyph: glyphChar });
  }
  const width = leftPadPx + count * stepPerGlyphPx + (KEY_SIG_RIGHT_PAD_SP - KEY_SIG_GLYPH_GAP_SP) * pxPerSp;
  return { glyphs, width };
}

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

  const clefWidthPx = opts.clefWidth ?? defaultClefWidthSp() * pxPerSp;
  const clefEndX = clefX + clefWidthPx;

  const keySig = parseKeySignature(node.key);
  const verticalCtx = {
    centerY,
    staffTopY,
    staffBottomY,
    pxPerSp,
    b4Step: B4_STEP,
  };
  const { glyphs: keySigGlyphs, width: keySigWidth } = buildKeySig(
    keySig,
    clefEndX,
    verticalCtx,
    pxPerSp,
  );

  const timeSigX = clefEndX + keySigWidth;
  const timeSigWidthPx = opts.timeSigWidth ?? defaultTimeSigWidthSp() * pxPerSp;
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

  const stemCtx = { pxPerSp, stemLengthSp: STEM_LENGTH_SP };

  const bars: ScoreBarLayout[] = node.bars.map((bar, barIdx) => {
    const barX = contentStart + barIdx * barWidth;
    const barlineX = barX + barWidth;
    const innerX = barX + barPaddingPx;
    const innerWidth = barWidth - barPaddingPx * 2;

    const accidentalDecisions = resolveAccidentals(bar.notes, keySig);
    const beatsList = bar.notes.map((n) => n.beats);
    const requiredWidthsPx = bar.notes.map(
      (n, i) => noteRequiredWidth(n, accidentalDecisions[i]?.kind ?? null) * pxPerSp,
    );
    const slots = distributeNotes(beatsList, requiredWidthsPx, innerWidth);

    // 슬롯은 좌측 정렬이라 마지막 슬롯의 trailing 잉여가 마디선 직전에 모두 몰린다.
    // 잉여의 절반만큼 모든 offset을 우측 시프트해 좌우 시각 균형을 맞춘다.
    const lastSlot = slots[slots.length - 1];
    const lastRequired = requiredWidthsPx[requiredWidthsPx.length - 1] ?? 0;
    const trailingResidual = lastSlot ? Math.max(0, lastSlot.slotWidth - lastRequired) : 0;
    const leadingShift = trailingResidual / 2;

    // 빔 그룹과 각 음표의 강제 stem 방향(그룹 평균 step 기준)을 사전 산정.
    const beamGroups = groupBeams(bar.notes, node.timeSignature);
    const forcedDirByIdx = new Map<number, 'up' | 'down'>();
    const inGroupIndices = new Set<number>();
    for (const g of beamGroups) {
      const dir = groupDirection(bar.notes, g);
      for (const idx of g.noteIndices) {
        forcedDirByIdx.set(idx, dir);
        inGroupIndices.add(idx);
      }
    }

    const notes: ScoreNoteLayout[] = bar.notes.map((note, noteIdx) => {
      const slot = slots[noteIdx];
      const noteX = innerX + (slot?.offset ?? 0) + leadingShift;
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
        forcedStemDirection: forcedDirByIdx.get(noteIdx) ?? null,
        suppressFlag: inGroupIndices.has(noteIdx),
      });
    });

    // 그룹별 빔 본선 좌표 산출 + stem y2를 빔에 정렬.
    const beams = layoutBeams(beamGroups, notes, bar.barNumber, pxPerSp);

    return { barNumber: bar.barNumber, x: barX, width: barWidth, barlineX, notes, beams };
  });

  const height = staffBottomY + HEIGHT_PADDING_SP * pxPerSp;
  return { width, height, staff, clef, keySig: keySigGlyphs, timeSig, bars, contentStart };
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
  // 빔 그룹의 강제 방향. null이면 음표 단독 규칙(step >= b4 → down).
  forcedStemDirection: 'up' | 'down' | null;
  // 그룹에 속한 음표는 flag을 그리지 않는다.
  suppressFlag: boolean;
}

function buildNoteLayout(args: BuildNoteArgs): ScoreNoteLayout {
  const { note, x, halfStepPx, bar, noteIdx, verticalCtx, stemCtx, accidentalKind, pxPerSp } =
    args;

  if (note.isRest) {
    const restAdvance = restAdvanceSp(note.beats);
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
      dots: makeDots(
        note,
        x + (restAdvance + DOT_GAP_SP) * pxPerSp,
        verticalCtx.centerY - halfStepPx,
      ),
      ledgerLines: [],
    };
  }

  const parsed = parsePitch(note.pitch);
  const midi = pitchToMidi(note.pitch);
  const step = letterStep(parsed.letter, parsed.octave);
  const y = verticalNoteY(step, verticalCtx);

  const headName = noteheadName(note.beats);
  const headGlyph = SMUFL[headName];
  const headAdvanceSp = GLYPHS[headName].advanceWidth;
  const effectiveDir =
    args.forcedStemDirection ?? stemDirection(step, verticalCtx.b4Step);
  const stem: ScoreNoteLayout['stem'] =
    note.beats >= 4
      ? undefined
      : (() => {
          const placement = placeStem(headName, x, y, effectiveDir, stemCtx);
          return { x: placement.x, y1: placement.y1, y2: placement.y2 };
        })();

  let flag: ScoreGlyph | undefined;
  if (!args.suppressFlag) {
    if (note.beats === 0.5 || note.beats === 0.75) {
      const fx = stem ? stem.x : x;
      const fy = stem?.y2 ?? y;
      flag = {
        x: fx,
        y: fy,
        glyph: effectiveDir === 'down' ? SMUFL.flag8thDown : SMUFL.flag8thUp,
      };
    } else if (note.beats === 0.25 || note.beats === 0.375) {
      const fx = stem ? stem.x : x;
      const fy = stem?.y2 ?? y;
      flag = {
        x: fx,
        y: fy,
        glyph: effectiveDir === 'down' ? SMUFL.flag16thDown : SMUFL.flag16thUp,
      };
    }
  }

  const accGlyph = accidentalGlyph(accidentalKind);
  const accidental: ScoreGlyph | undefined = accGlyph
    ? { x: x - ACCIDENTAL_X_OFFSET_SP * pxPerSp, y, glyph: accGlyph }
    : undefined;

  const ll = ledgerLines(y, x, verticalCtx, headAdvanceSp);

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
    dots: makeDots(
      note,
      x + (headAdvanceSp + DOT_GAP_SP) * pxPerSp,
      isLineNoteStep(step, verticalCtx.b4Step) ? y - halfStepPx : y,
    ),
    ledgerLines: ll,
  };
  if (stem) out.stem = stem;
  if (flag) out.flag = flag;
  if (accidental) out.accidental = accidental;
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// 빔 그룹 방향/배치
// ─────────────────────────────────────────────────────────────────────────────
function groupDirection(notes: readonly NoteEvent[], g: BeamGroup): 'up' | 'down' {
  let stepSum = 0;
  let count = 0;
  for (const idx of g.noteIndices) {
    const n = notes[idx];
    if (!n || n.isRest || !n.pitch) continue;
    const parsed = parsePitch(n.pitch);
    stepSum += letterStep(parsed.letter, parsed.octave);
    count += 1;
  }
  if (count === 0) return 'up';
  return stepSum / count >= B4_STEP ? 'down' : 'up';
}

function layoutBeams(
  groups: readonly BeamGroup[],
  notes: ScoreNoteLayout[],
  barNumber: number,
  pxPerSp: number,
): ScoreBeam[] {
  const result: ScoreBeam[] = [];
  const thickness = ENGRAVING.beamThickness * pxPerSp;
  const spacing = ENGRAVING.beamSpacing * pxPerSp;
  for (const g of groups) {
    const grouped = g.noteIndices
      .map((i) => notes[i])
      .filter((n): n is ScoreNoteLayout => !!n && !!n.stem);
    if (grouped.length < 2) continue;

    const firstStem = grouped[0]!.stem!;
    const dir: 'up' | 'down' = firstStem.y2 < firstStem.y1 ? 'up' : 'down';

    const y2List = grouped.map((n) => n.stem!.y2);
    const beamY = dir === 'up' ? Math.min(...y2List) : Math.max(...y2List);

    // 그룹 내 모든 stem 끝을 빔 라인에 정렬한다.
    for (const n of grouped) {
      n.stem!.y2 = beamY;
    }

    const x1 = grouped[0]!.stem!.x;
    const x2 = grouped[grouped.length - 1]!.stem!.x;

    const lines: ScoreBeamLine[] = [{ x1, x2, y: beamY, thickness }];
    if (g.beamCount === 2) {
      // 16분 보조선은 머리 방향(stem 반대 방향)으로 (thickness + spacing)만큼 이격.
      const sign = dir === 'up' ? 1 : -1;
      lines.push({ x1, x2, y: beamY + sign * (thickness + spacing), thickness });
    }

    result.push({ barNumber, noteIndices: [...g.noteIndices], lines });
  }
  return result;
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

function restAdvanceSp(beats: number): number {
  if (beats >= 4) return GLYPHS.restWhole.advanceWidth;
  if (beats >= 2) return GLYPHS.restHalf.advanceWidth;
  if (beats >= 1) return GLYPHS.restQuarter.advanceWidth;
  if (beats >= 0.5) return GLYPHS.rest8th.advanceWidth;
  return GLYPHS.rest16th.advanceWidth;
}

function isDottedDuration(note: NoteEvent): boolean {
  return note.duration.endsWith('.');
}

function makeDots(note: NoteEvent, x: number, y: number): { x: number; y: number }[] {
  return isDottedDuration(note) ? [{ x, y }] : [];
}

function isLineNoteStep(step: number, b4Step: number): boolean {
  // treble clef 기준: step과 b4(=line) 차의 짝수성으로 line/space 구분.
  return Math.abs((step - b4Step) % 2) === 0;
}
