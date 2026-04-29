import { GLYPHS } from '@oon/smufl-asset';
import type { NoteEvent } from '@oon/core';
import type { AccidentalKind } from './accidentals.js';

// ─────────────────────────────────────────────────────────────────────────────
// P4: 음표 최소 폭(sp) 계산
// P5: 마디 내 비선형 분배 (Gourlay 단순화 — beats^elasticity)
// 모든 단위는 staff space(sp). px 변환은 호출자 측에서 수행한다.
// ─────────────────────────────────────────────────────────────────────────────

// 음표 사이 좌우로 두는 최소 패딩(sp). SMuFL 표준은 noteSpacing 항목으로 정의되지만
// 본 단계에서는 보수적인 고정값으로 둔다(S5에서 ENGRAVING으로 이관 가능).
const MIN_GAP_SP = 0.6;

// 임시표 폭 추정. 글리프별로 다소 다르지만 본 단계에서는 sharp 기준으로 통일.
const ACCIDENTAL_GAP_SP = 0.2; // 임시표 → 머리 사이 간격

// 점(augmentation dot) 영역 폭(sp). dotGlyph.advanceWidth + 약간의 패딩.
const DOT_AREA_SP = 0.6;

function accidentalGlyphName(kind: AccidentalKind):
  | 'accidentalSharp'
  | 'accidentalFlat'
  | 'accidentalNatural'
  | 'accidentalDoubleSharp'
  | 'accidentalDoubleFlat'
  | null {
  switch (kind) {
    case 'sharp':
      return 'accidentalSharp';
    case 'flat':
      return 'accidentalFlat';
    case 'natural':
      return 'accidentalNatural';
    case 'doubleSharp':
      return 'accidentalDoubleSharp';
    case 'doubleFlat':
      return 'accidentalDoubleFlat';
    default:
      return null;
  }
}

function noteheadAdvanceSp(beats: number): number {
  if (beats >= 4) return GLYPHS.noteheadWhole.advanceWidth;
  if (beats >= 2) return GLYPHS.noteheadHalf.advanceWidth;
  return GLYPHS.noteheadBlack.advanceWidth;
}

function restAdvanceSp(beats: number): number {
  if (beats >= 4) return GLYPHS.restWhole.advanceWidth;
  if (beats >= 2) return GLYPHS.restHalf.advanceWidth;
  if (beats >= 1) return GLYPHS.restQuarter.advanceWidth;
  if (beats >= 0.5) return GLYPHS.rest8th.advanceWidth;
  return GLYPHS.rest16th.advanceWidth;
}

function hasDot(beats: number): boolean {
  const integer = Math.floor(beats);
  const remainder = beats - integer;
  return integer > 0 && Math.abs(remainder - integer * 0.5) < 0.001;
}

// 음표가 차지해야 할 최소 폭(sp). 임시표/점/노트헤드/우측 패딩 합산.
export function noteRequiredWidth(note: NoteEvent, accidentalKind: AccidentalKind): number {
  const headW = note.isRest ? restAdvanceSp(note.beats) : noteheadAdvanceSp(note.beats);

  let leftExtra = 0;
  if (!note.isRest) {
    const accName = accidentalGlyphName(accidentalKind);
    if (accName) {
      leftExtra += GLYPHS[accName].advanceWidth + ACCIDENTAL_GAP_SP;
    }
  }

  let rightExtra = MIN_GAP_SP;
  if (hasDot(note.beats)) rightExtra += DOT_AREA_SP;

  return leftExtra + headW + rightExtra;
}

export interface DistributeOptions {
  // 가중치 곡선의 elasticity. Gourlay 표준 0.5~0.6.
  exponent?: number;
}

export interface DistributedSlot {
  // 마디 내 좌측 기준 음표 x 위치(slot 시작점에서 임시표가 차지하는 공간 이후 노트헤드 기준 위치).
  // 호출자는 innerX를 더해 최종 x를 구한다.
  offset: number;
  // 슬롯 폭(sp). 다음 음표까지의 거리.
  slotWidth: number;
}

// 마디 안의 음표들을 비선형 가중치로 innerWidth(sp)에 분배한다.
// 단계:
//   1. 각 음표의 ideal weight = beats^k.
//   2. 슬롯 폭 = max(weight 비례 폭, requiredWidth). 부족분은 다음 단계에서 잔여 폭을 비례 재분배.
//   3. 모든 음표가 minWidth로 고정되더라도 합이 innerWidth를 넘으면 그대로 둔다(좁은 마디 허용).
export function distributeNotes(
  beatsList: readonly number[],
  requiredWidths: readonly number[],
  innerWidth: number,
  opts: DistributeOptions = {},
): DistributedSlot[] {
  const n = beatsList.length;
  if (n === 0) return [];
  if (n !== requiredWidths.length) {
    throw new Error('beatsList and requiredWidths length mismatch');
  }
  const exponent = opts.exponent ?? 0.6;

  const weights = beatsList.map((b) => Math.pow(Math.max(b, 0.001), exponent));
  const slotWidths = new Array<number>(n).fill(0);
  const fixed = new Array<boolean>(n).fill(false);

  // 잔여 폭과 잔여 가중치 합을 줄여가며 minWidth 충돌을 해소.
  let remainingWidth = innerWidth;
  let remainingWeight = weights.reduce((s, w) => s + w, 0);

  // 최대 n번 반복으로 수렴(매 반복에서 적어도 한 슬롯이 fixed로 전환되거나 종료).
  for (let iter = 0; iter < n; iter += 1) {
    let changed = false;
    for (let i = 0; i < n; i += 1) {
      if (fixed[i]) continue;
      const wi = weights[i];
      const req = requiredWidths[i];
      if (wi === undefined || req === undefined) continue;
      if (remainingWeight <= 0) break;
      const ideal = (wi / remainingWeight) * remainingWidth;
      if (ideal < req) {
        slotWidths[i] = req;
        fixed[i] = true;
        remainingWidth -= req;
        remainingWeight -= wi;
        changed = true;
      }
    }
    if (!changed) break;
  }

  // 남은 슬롯들에 잔여 폭을 가중치 비례로 분배.
  for (let i = 0; i < n; i += 1) {
    if (fixed[i]) continue;
    const wi = weights[i];
    if (wi === undefined) continue;
    if (remainingWeight <= 0) {
      slotWidths[i] = requiredWidths[i] ?? 0;
      continue;
    }
    slotWidths[i] = (wi / remainingWeight) * remainingWidth;
  }

  // offset 누적.
  const slots: DistributedSlot[] = [];
  let acc = 0;
  for (let i = 0; i < n; i += 1) {
    const w = slotWidths[i] ?? 0;
    slots.push({ offset: acc, slotWidth: w });
    acc += w;
  }
  return slots;
}

// clef 영역 폭(sp). 글리프 advanceWidth + 좌우 패딩.
export function defaultClefWidthSp(): number {
  return GLYPHS.gClef.advanceWidth + 1.0; // 우측 여유 1 sp
}

// timeSig 영역 폭(sp). 자리 글리프 폭 + 좌우 패딩. 두 자리는 위/아래로 쌓이므로 폭은 한 글리프 폭만 필요.
export function defaultTimeSigWidthSp(): number {
  return GLYPHS.timeSig0.advanceWidth + 1.0;
}
