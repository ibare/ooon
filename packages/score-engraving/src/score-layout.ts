import { ENGRAVING, GLYPHS, type Sp } from '@oon/smufl-asset';
import {
  parsePitch,
  pitchToMidi,
  SMUFL,
  type NoteEvent,
  type ScoreBar,
  type ScoreNode,
  type TimeSignature,
} from '@oon/core';
import {
  flagKind,
  isDotted,
  noteHasStem,
  noteheadGlyphName,
  restAdvanceSp,
  restGlyphChar,
} from './notation/duration-glyph.js';
import type {
  ScoreBarLayout,
  ScoreBeam,
  ScoreBeamLine,
  ScoreGlyph,
  ScoreHeadLayout,
  ScoreLayout,
  ScoreNoteLayout,
  ScoreStaff,
  ScoreSystemLayout,
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
import { placeStem } from './passes/stem.js';
import { placeChord } from './passes/chord-heads.js';
import {
  defaultClefWidthSp,
  defaultTimeSigWidthSp,
  distributeNotesByBeat,
  noteRequiredWidth,
} from './passes/spacing.js';
import { groupBeams, type BeamGroup } from './passes/beams.js';
import { barWidthRange, fitBarWidth } from './passes/bar-width.js';
import { chooseEditLayout } from './passes/edit-layout.js';
import { chooseRenderLayout } from './passes/render-layout.js';

export interface ScoreLayoutOptions {
  width: number;
  staffY?: number;
  lineGap?: number;
  clefWidth?: number;
  timeSigWidth?: number;
  barPadding?: number;
  /**
   * 'auto'면 박자별 마디 폭 범위로 wrap을 결정한다(uniform grid). 'none'이면 모든 마디를
   * 단일 system에 자연 폭으로 욱여넣는다(composition 등 외부에서 system별 재계산용).
   * 기본값 'auto'.
   */
  wrap?: 'auto' | 'none';
  /**
   * 레이아웃 정책. 'edit'는 슬롯 클릭 임계 우선(편집 모드), 'render'는 컨테이너 정합 +
   * 자연 폭 상한(렌더 모드). 기본값 'render' — score-editor만 'edit'를 명시한다.
   * wrap='none'일 때는 자연 폭 단일 시스템 강제이므로 density는 무시된다.
   */
  density?: 'edit' | 'render';
  /** system 간 수직 간격(px). */
  systemGap?: number;
}

const sp = (n: number): Sp => n as Sp;

// ─────────────────────────────────────────────────────────────────────────────
// 단위 규약 — 모든 sp(staff space) 기반. layout 결과는 px.
// pxPerSp = lineGap (보표 한 칸의 px 크기).
// ─────────────────────────────────────────────────────────────────────────────
const STAFF_HALF_HEIGHT_SP = sp(2);
const STAFF_HEIGHT_SP = sp(4);
const STEM_LENGTH_SP = sp(3.5);

const CLEF_LEFT_PAD_SP = sp(1.0);
const BAR_INNER_PAD_SP = sp(0.8);
const RIGHT_MARGIN_SP = sp(1.0);
const HEIGHT_PADDING_SP = sp(6.0); // 보표 아래 여유(음이름 표시 영역 등)
const TOP_PADDING_SP = sp(2.0); // 보표 위 여유(ledger lines 영역 등)
const DOT_GAP_SP = sp(0.25);
const ACCIDENTAL_X_OFFSET_SP = sp(1.2);
const KEY_SIG_LEFT_PAD_SP = sp(0.4);
const KEY_SIG_GLYPH_GAP_SP = sp(0.1);
const KEY_SIG_RIGHT_PAD_SP = sp(0.6);

const LETTER_STEP: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

function letterStep(letter: string, octave: number): number {
  const idx = LETTER_STEP[letter];
  if (idx === undefined) throw new Error(`Invalid letter: ${letter}`);
  return octave * 7 + idx;
}

const B4_STEP = letterStep('B', 4);

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

// 키사인 글리프 개수와 모드 산출. width 계산과 글리프 배치에 공통 사용.
function keySigShape(map: KeySignatureMap): { count: number; isFlats: boolean } {
  let sharpCount = 0;
  for (const l of SHARPS_ORDER) if (map[l] === 1) sharpCount += 1;
  let flatCount = 0;
  for (const l of FLATS_ORDER) if (map[l] === -1) flatCount += 1;
  const isFlats = flatCount > 0 && sharpCount === 0;
  return { count: isFlats ? flatCount : sharpCount, isFlats };
}

function computeKeySigWidthPx(map: KeySignatureMap, pxPerSp: number): number {
  const { count, isFlats } = keySigShape(map);
  if (count === 0) return 0;
  const glyphInfo = isFlats ? GLYPHS.accidentalFlat : GLYPHS.accidentalSharp;
  const stepPerGlyphPx = (glyphInfo.advanceWidth + KEY_SIG_GLYPH_GAP_SP) * pxPerSp;
  const leftPadPx = KEY_SIG_LEFT_PAD_SP * pxPerSp;
  return leftPadPx + count * stepPerGlyphPx + (KEY_SIG_RIGHT_PAD_SP - KEY_SIG_GLYPH_GAP_SP) * pxPerSp;
}

function buildKeySig(
  map: KeySignatureMap,
  startX: number,
  ctx: KeySigVerticalCtx,
  pxPerSp: number,
): ScoreGlyph[] {
  const { count, isFlats } = keySigShape(map);
  if (count === 0) return [];

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
  return glyphs;
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

interface SystemBuildArgs {
  systemIndex: number;
  staffCenterY: number;
  bars: readonly ScoreBar[];
  /** 모든 마디에 적용되는 동일 폭(px). 호출자가 chooseEditLayout/chooseRenderLayout으로 결정해 전달. */
  barWidth: number;
  pxPerSp: number;
  clefWidthPx: number;
  keySigWidthPx: number;
  timeSigWidthPx: number;
  barPaddingPx: number;
  keySig: KeySignatureMap;
  timeSignature: TimeSignature;
}

function buildSystem(args: SystemBuildArgs): ScoreSystemLayout {
  const {
    systemIndex,
    staffCenterY,
    bars,
    barWidth,
    pxPerSp,
    clefWidthPx,
    keySigWidthPx,
    timeSigWidthPx,
    barPaddingPx,
    keySig,
    timeSignature,
  } = args;

  const halfStepPx = 0.5 * pxPerSp;
  const staffTopY = staffCenterY - STAFF_HALF_HEIGHT_SP * pxPerSp;
  const staffBottomY = staffTopY + STAFF_HEIGHT_SP * pxPerSp;

  const staff: ScoreStaff = {
    y: staffCenterY,
    top: staffTopY,
    bottom: staffBottomY,
    lineGap: pxPerSp,
    lines: [0, 1, 2, 3, 4].map((i) => staffTopY + i * pxPerSp),
  };

  const clefX = CLEF_LEFT_PAD_SP * pxPerSp;
  const clef: ScoreGlyph = { x: clefX, y: staffCenterY + pxPerSp, glyph: SMUFL.gClef };
  const clefEndX = clefX + clefWidthPx;

  const verticalCtx: KeySigVerticalCtx = {
    centerY: staffCenterY,
    staffTopY,
    staffBottomY,
    pxPerSp,
    b4Step: B4_STEP,
  };
  const keySigGlyphs = buildKeySig(keySig, clefEndX, verticalCtx, pxPerSp);

  const timeSigX = clefEndX + keySigWidthPx;
  const timeSig: ScoreTimeSig = {
    x: timeSigX,
    cx: timeSigX + timeSigWidthPx / 2,
    topGlyph: SMUFL.timeSigNumber(timeSignature.beats),
    topY: staffTopY + pxPerSp,
    bottomGlyph: SMUFL.timeSigNumber(timeSignature.beatValue),
    bottomY: staffTopY + pxPerSp * 3,
  };

  const contentStart = timeSigX + timeSigWidthPx;
  const stemCtx = { pxPerSp, stemLengthSp: STEM_LENGTH_SP };

  const layoutBars: ScoreBarLayout[] = bars.map((bar, barIdx) => {
    const barX = contentStart + barIdx * barWidth;
    const barlineX = barX + barWidth;
    const innerX = barX + barPaddingPx;
    const innerWidth = barWidth - barPaddingPx * 2;

    const accidentalDecisions = resolveAccidentals(bar.notes, keySig);
    const beatsList = bar.notes.map((n) => n.beats);
    const requiredWidthsPx = bar.notes.map(
      (n, i) => noteRequiredWidth(n, accidentalDecisions[i]?.kinds ?? []) * pxPerSp,
    );
    const slots = distributeNotesByBeat(
      beatsList,
      requiredWidthsPx,
      innerWidth,
      timeSignature.beats,
    );

    const beamGroups = groupBeams(bar.notes, timeSignature);
    const forcedDirByIdx = new Map<number, 'up' | 'down'>();
    const inGroupIndices = new Set<number>();
    for (const g of beamGroups) {
      const dir = groupDirection(bar.notes, g, B4_STEP);
      for (const idx of g.noteIndices) {
        forcedDirByIdx.set(idx, dir);
        inGroupIndices.add(idx);
      }
    }

    const notes: ScoreNoteLayout[] = bar.notes.map((note, noteIdx) => {
      const slot = slots[noteIdx];
      const noteX = innerX + (slot?.offset ?? 0);
      const decision = accidentalDecisions[noteIdx];
      return buildNoteLayout({
        note,
        x: noteX,
        halfStepPx,
        bar: bar.barNumber,
        noteIdx,
        verticalCtx,
        stemCtx,
        accidentalKinds: decision?.kinds ?? [],
        pxPerSp,
        forcedStemDirection: forcedDirByIdx.get(noteIdx) ?? null,
        suppressFlag: inGroupIndices.has(noteIdx),
      });
    });

    const beams = layoutBeams(beamGroups, notes, bar.barNumber, pxPerSp);

    return { barNumber: bar.barNumber, x: barX, width: barWidth, barlineX, notes, beams };
  });

  const systemTop = staffTopY - TOP_PADDING_SP * pxPerSp;
  const systemBottom = staffBottomY + HEIGHT_PADDING_SP * pxPerSp;

  return {
    index: systemIndex,
    y: systemTop,
    height: systemBottom - systemTop,
    staff,
    clef,
    keySig: keySigGlyphs,
    timeSig,
    bars: layoutBars,
    contentStart,
  };
}

export function calculateScoreLayout(node: ScoreNode, opts: ScoreLayoutOptions): ScoreLayout {
  const inputWidth = opts.width;
  const pxPerSp = opts.lineGap ?? 10;
  const wrap = opts.wrap ?? 'auto';
  const density = opts.density ?? 'render';
  const systemGap = opts.systemGap ?? pxPerSp * 2;

  const keySig = parseKeySignature(node.key);
  const clefWidthPx = opts.clefWidth ?? defaultClefWidthSp() * pxPerSp;
  const timeSigWidthPx = opts.timeSigWidth ?? defaultTimeSigWidthSp() * pxPerSp;
  const barPaddingPx = opts.barPadding ?? BAR_INNER_PAD_SP * pxPerSp;
  const keySigWidthPx = computeKeySigWidthPx(keySig, pxPerSp);

  const preambleWidth =
    CLEF_LEFT_PAD_SP * pxPerSp + clefWidthPx + keySigWidthPx + timeSigWidthPx;
  const rightMarginPx = RIGHT_MARGIN_SP * pxPerSp;
  const availableContent = Math.max(inputWidth - preambleWidth - rightMarginPx, pxPerSp * 4);

  // wrap N과 마디 폭 결정 — 박자별 마디 폭 범위 + density 정책.
  // wrap='none'은 외부(예: composition)에서 시스템 그룹을 별도로 결정한 뒤 단일 시스템으로
  // 다시 계산하는 용도. systemCount=1, barsPerSystem=barCount는 호출자 의도(한 줄에 다 넣기)에
  // 따라 강제하되, barWidth는 fitBarWidth로 자연 폭 상한 + 컨테이너 균등 축소를 적용한다.
  // density는 wrap='none'에선 의미가 없어 무시된다(편집 모드도 시스템 그룹은 외부 결정).
  const widthRange = barWidthRange(node.timeSignature, pxPerSp, barPaddingPx);
  const choosePolicy = density === 'edit' ? chooseEditLayout : chooseRenderLayout;
  const plan =
    wrap === 'none'
      ? {
          barsPerSystem: Math.max(1, node.bars.length),
          systemCount: 1,
          barWidth: fitBarWidth(widthRange, availableContent, node.bars.length),
        }
      : choosePolicy({
          barCount: node.bars.length,
          range: widthRange,
          availableContent,
        });

  // 시스템 그룹화 — 모든 줄이 동일 N개 마디(마지막 줄만 1~N개).
  const groups: number[][] = [];
  if (node.bars.length === 0) {
    groups.push([]);
  } else {
    for (let i = 0; i < node.bars.length; i += plan.barsPerSystem) {
      const len = Math.min(plan.barsPerSystem, node.bars.length - i);
      groups.push(Array.from({ length: len }, (_, k) => i + k));
    }
  }

  const systems: ScoreSystemLayout[] = [];
  const initialStaffCenterY = opts.staffY ?? 40;
  let nextSystemTop = initialStaffCenterY - STAFF_HALF_HEIGHT_SP * pxPerSp - TOP_PADDING_SP * pxPerSp;

  for (let si = 0; si < groups.length; si += 1) {
    const indices = groups[si]!;
    const barsForSystem = indices.map((i) => node.bars[i]!);
    const staffCenterY = nextSystemTop + TOP_PADDING_SP * pxPerSp + STAFF_HALF_HEIGHT_SP * pxPerSp;

    const system = buildSystem({
      systemIndex: si,
      staffCenterY,
      bars: barsForSystem,
      barWidth: plan.barWidth,
      pxPerSp,
      clefWidthPx,
      keySigWidthPx,
      timeSigWidthPx,
      barPaddingPx,
      keySig,
      timeSignature: node.timeSignature,
    });
    systems.push(system);
    nextSystemTop = system.y + system.height + systemGap;
  }

  const totalHeight =
    systems.length === 0
      ? STAFF_HEIGHT_SP * pxPerSp + (TOP_PADDING_SP + HEIGHT_PADDING_SP) * pxPerSp
      : nextSystemTop - systemGap;

  return { width: inputWidth, height: totalHeight, systems };
}

interface BuildNoteArgs {
  note: NoteEvent;
  x: number;
  halfStepPx: number;
  bar: number;
  noteIdx: number;
  verticalCtx: KeySigVerticalCtx;
  stemCtx: { pxPerSp: number; stemLengthSp: number };
  accidentalKinds: readonly AccidentalKind[];
  pxPerSp: number;
  forcedStemDirection: 'up' | 'down' | null;
  suppressFlag: boolean;
}

function buildNoteLayout(args: BuildNoteArgs): ScoreNoteLayout {
  const { note, x, halfStepPx, bar, noteIdx, verticalCtx, stemCtx, accidentalKinds, pxPerSp } =
    args;

  if (note.isRest) {
    const restAdvance = restAdvanceSp(note.duration);
    const glyph = restGlyphChar(note.duration);
    return {
      barNumber: bar,
      noteIndex: noteIdx,
      x,
      beats: note.beats,
      isRest: true,
      heads: [],
      restGlyph: glyph,
      restY: verticalCtx.centerY,
      dots: makeDots(
        note,
        x + (restAdvance + DOT_GAP_SP) * pxPerSp,
        verticalCtx.centerY - halfStepPx,
      ),
    };
  }

  const headName = noteheadGlyphName(note.duration);
  const headGlyph = SMUFL[headName];
  const headAdvanceSp = GLYPHS[headName].advanceWidth;

  // 화음 정보 구축. 단음(pitches.length === 1)도 동일 경로로 처리해 분기를 줄인다.
  const pitchInfos = note.pitches.map((p, i) => {
    const parsed = parsePitch(p);
    return {
      index: i,
      step: letterStep(parsed.letter, parsed.octave),
      accidental: accidentalKinds[i] ?? null,
    };
  });
  const placement = placeChord(pitchInfos, verticalCtx.b4Step);
  const effectiveDir = args.forcedStemDirection ?? placement.direction;

  // outermost head — stem이 붙는 head. stem-up이면 가장 낮은(맨 아래) head, stem-down이면 가장 높은 head.
  const sortedHeads = placement.heads;
  const stemAnchorHead = effectiveDir === 'up' ? sortedHeads[0]! : sortedHeads[sortedHeads.length - 1]!;

  // accidental column 좌측 끝 — 가장 좌측 column의 x.
  const accColUnitPx = ACCIDENTAL_X_OFFSET_SP * pxPerSp;
  const accColCount = placement.accidentalColumnCount;
  // shifted head가 left side(stem-down)면 head pile의 가장 좌측이 x - headAdvance.
  // accidental은 그 좌측에 column 단위로 쌓인다. 단, shifted head가 right side(stem-up)이면 headPileLeftX는 x.
  const headPileLeftX = effectiveDir === 'down' && placement.hasShiftedHead
    ? x - headAdvanceSp * pxPerSp
    : x;

  // heads 배치
  const heads: ScoreHeadLayout[] = sortedHeads.map((h) => {
    const y = verticalNoteY(h.step, verticalCtx);
    let xOffset = 0;
    if (h.side === 'shifted') {
      xOffset = effectiveDir === 'up' ? +headAdvanceSp * pxPerSp : -headAdvanceSp * pxPerSp;
    }
    const headX = x + xOffset;
    const ll = ledgerLines(y, headX, verticalCtx, headAdvanceSp);
    const head: ScoreHeadLayout = {
      pitch: note.pitches[h.index]!,
      midi: pitchToMidi(note.pitches[h.index]!),
      y,
      xOffset,
      headGlyph,
      ledgerLines: ll,
    };
    if (h.accidental && h.accidentalColumn >= 0) {
      const accGlyph = accidentalGlyph(h.accidental);
      if (accGlyph) {
        // column 0이 화음에 가장 가깝다(rightmost). 좌측으로 갈수록 column 인덱스 증가.
        const colFromRight = h.accidentalColumn;
        const ax = headPileLeftX - (colFromRight + 1) * accColUnitPx;
        head.accidental = { x: ax, y, glyph: accGlyph };
      }
    }
    return head;
  });

  // stem — outermost head의 y에서 시작.
  const stemAnchorY = verticalNoteY(stemAnchorHead.step, verticalCtx);
  const stemAnchorXOffset = stemAnchorHead.side === 'shifted'
    ? (effectiveDir === 'up' ? +headAdvanceSp * pxPerSp : -headAdvanceSp * pxPerSp)
    : 0;
  const stemAnchorX = x + stemAnchorXOffset;
  const stem: ScoreNoteLayout['stem'] = !noteHasStem(note.duration)
    ? undefined
    : (() => {
        const placementStem = placeStem(headName, stemAnchorX, stemAnchorY, effectiveDir, stemCtx);
        // 화음 stem 길이 — Behind Bars 표준: outermost head로 결정한 anchor에서 시작해
        // **반대편 head 기준으로 정상 stem 길이(=단음 stem 길이)만큼** 추가 연장한다.
        // 즉 stem 끝점은 oppositeY ± stemLenPx. 단음(heads.length===1)에서는 oppositeY===anchorY이므로
        // 결과는 placementStem.y2와 동일(분기 불필요).
        const oppositeHead = effectiveDir === 'up' ? sortedHeads[sortedHeads.length - 1]! : sortedHeads[0]!;
        const oppositeY = verticalNoteY(oppositeHead.step, verticalCtx);
        const stemLenPx = Math.abs(placementStem.y1 - placementStem.y2);
        const y2 = effectiveDir === 'up' ? oppositeY - stemLenPx : oppositeY + stemLenPx;
        return { x: placementStem.x, y1: placementStem.y1, y2 };
      })();

  let flag: ScoreGlyph | undefined;
  if (!args.suppressFlag) {
    const fk = flagKind(note.duration);
    if (fk === '8th') {
      const fx = stem ? stem.x : stemAnchorX;
      const fy = stem?.y2 ?? stemAnchorY;
      flag = {
        x: fx,
        y: fy,
        glyph: effectiveDir === 'down' ? SMUFL.flag8thDown : SMUFL.flag8thUp,
      };
    } else if (fk === '16th') {
      const fx = stem ? stem.x : stemAnchorX;
      const fy = stem?.y2 ?? stemAnchorY;
      flag = {
        x: fx,
        y: fy,
        glyph: effectiveDir === 'down' ? SMUFL.flag16thDown : SMUFL.flag16thUp,
      };
    }
  }

  // dots — 화음 전체에 한 묶음. 각 head의 y에 점을 찍지 않고, anchor 노트헤드 y 기준으로 단순화.
  // (음악 조판에서는 각 head 옆에 점을 두지만, 본 패스에서는 stemAnchorHead 기준으로 충분.)
  const dotsX = x + (headAdvanceSp + DOT_GAP_SP) * pxPerSp + (placement.hasShiftedHead && effectiveDir === 'up' ? headAdvanceSp * pxPerSp : 0);
  const dotsY = isLineNoteStep(stemAnchorHead.step, verticalCtx.b4Step) ? stemAnchorY - halfStepPx : stemAnchorY;

  const out: ScoreNoteLayout = {
    barNumber: bar,
    noteIndex: noteIdx,
    x,
    beats: note.beats,
    isRest: false,
    heads,
    dots: makeDots(note, dotsX, dotsY),
  };
  if (stem) out.stem = stem;
  if (flag) out.flag = flag;
  return out;
}

function groupDirection(notes: readonly NoteEvent[], g: BeamGroup, b4Step: number): 'up' | 'down' {
  // 화음을 포함한 그룹의 방향 결정 — 각 음표의 outermost head step을 평균낸다.
  // outermost = b4_step에서 가장 먼 step. 화음이 없으면 단음 step.
  let stepSum = 0;
  let count = 0;
  for (const idx of g.noteIndices) {
    const n = notes[idx];
    if (!n || n.isRest || n.pitches.length === 0) continue;
    let outerStep = 0;
    let outerDist = -1;
    for (const p of n.pitches) {
      const parsed = parsePitch(p);
      const s = letterStep(parsed.letter, parsed.octave);
      const d = Math.abs(s - b4Step);
      if (d > outerDist) {
        outerDist = d;
        outerStep = s;
      }
    }
    stepSum += outerStep;
    count += 1;
  }
  if (count === 0) return 'up';
  return stepSum / count >= b4Step ? 'down' : 'up';
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

    for (const n of grouped) {
      n.stem!.y2 = beamY;
    }

    const x1 = grouped[0]!.stem!.x;
    const x2 = grouped[grouped.length - 1]!.stem!.x;

    const lines: ScoreBeamLine[] = [{ x1, x2, y: beamY, thickness }];
    if (g.beamCount === 2) {
      const sign = dir === 'up' ? 1 : -1;
      lines.push({ x1, x2, y: beamY + sign * (thickness + spacing), thickness });
    }

    result.push({ barNumber, noteIndices: [...g.noteIndices], lines });
  }
  return result;
}

function makeDots(note: NoteEvent, x: number, y: number): { x: number; y: number }[] {
  return isDotted(note.duration) ? [{ x, y }] : [];
}

function isLineNoteStep(step: number, b4Step: number): boolean {
  return Math.abs((step - b4Step) % 2) === 0;
}
