import { GLYPHS } from '@oon/smufl-asset';
import type { NoteEvent } from '@oon/core';
import type { AccidentalKind } from './accidentals.js';
import {
  isDotted,
  noteheadAdvanceSp,
  restAdvanceSp,
} from '../notation/duration-glyph.js';

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

// 음표가 차지해야 할 최소 폭(sp). 임시표/점/노트헤드/우측 패딩 합산.
export function noteRequiredWidth(note: NoteEvent, accidentalKind: AccidentalKind): number {
  const headW = note.isRest ? restAdvanceSp(note.duration) : noteheadAdvanceSp(note.duration);

  let leftExtra = 0;
  if (!note.isRest) {
    const accName = accidentalGlyphName(accidentalKind);
    if (accName) {
      leftExtra += GLYPHS[accName].advanceWidth + ACCIDENTAL_GAP_SP;
    }
  }

  let rightExtra = MIN_GAP_SP;
  if (isDotted(note.duration)) rightExtra += DOT_AREA_SP;

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

export interface DistributeByBeatOptions {
  // 박자 슬롯 내부 광학 분배에 쓰이는 elasticity. distributeNotes의 exponent와 동의어.
  exponent?: number;
}

// 박자 경계는 strict 균등(beatsPerBar 등분), 박자 슬롯 안의 음표가 다수면 그 슬롯 폭 안에서
// 기존 distributeNotes(광학)을 적용하는 하이브리드 분배.
//
// - 한 박자 슬롯에 음표 1개: 슬롯 시작 위치에서 시작, slotWidth = note.beats × beatSlotWidth.
//   따라서 1박짜리 음표 1개는 정확히 한 박자 폭, 점4분(1.5박)은 1.5박자 폭을 차지한다.
//   결과적으로 노트 헤드 위치가 항상 박자 격자에 정렬되어 편집 슬롯/오버레이와 일관된다.
// - 한 박자 슬롯에 음표 2개 이상(예: 8분 두 개): 그 슬롯 폭 안에서 distributeNotes를 호출해
//   광학 간격으로 재분배. 박자 경계는 그대로 유지.
// - 박자 경계를 넘는 음표(점4분 등): 시작 박자 슬롯에 배정하고 폭만 길게 늘인다(다음 박자
//   슬롯에 시각적으로 침범). 다음 박자 슬롯의 시작 위치는 변하지 않는다.
//
// 설계 의도: 입문자용 편집 UX의 "박자 영역" 직관을 출력 악보에서도 그대로 유지.
export function distributeNotesByBeat(
  beatsList: readonly number[],
  requiredWidths: readonly number[],
  innerWidth: number,
  beatsPerBar: number,
  opts: DistributeByBeatOptions = {},
): DistributedSlot[] {
  const n = beatsList.length;
  if (n === 0) return [];
  if (n !== requiredWidths.length) {
    throw new Error('beatsList and requiredWidths length mismatch');
  }
  if (beatsPerBar <= 0) {
    return distributeNotes(beatsList, requiredWidths, innerWidth, opts);
  }

  const beatSlotWidth = innerWidth / beatsPerBar;

  // 음표를 시작 박자 인덱스(floor(누적합))로 그룹핑.
  // 박자 경계를 넘는 음표는 시작 박자 슬롯에만 배정된다.
  const groups: number[][] = Array.from({ length: beatsPerBar }, () => []);
  let acc = 0;
  for (let i = 0; i < n; i += 1) {
    const startBeat = acc;
    const slotIdx = Math.min(beatsPerBar - 1, Math.max(0, Math.floor(startBeat + 1e-9)));
    groups[slotIdx]!.push(i);
    acc += beatsList[i] ?? 0;
  }

  const slots: DistributedSlot[] = new Array<DistributedSlot>(n);
  acc = 0;
  for (let i = 0; i < n; i += 1) {
    // placeholder; 실제 값은 아래 그룹별 분배에서 채운다.
    slots[i] = { offset: 0, slotWidth: 0 };
  }

  for (let g = 0; g < beatsPerBar; g += 1) {
    const indices = groups[g]!;
    if (indices.length === 0) continue;
    const groupOffsetX = g * beatSlotWidth;

    if (indices.length === 1) {
      const i = indices[0]!;
      const noteBeats = beatsList[i] ?? 0;
      slots[i] = { offset: groupOffsetX, slotWidth: noteBeats * beatSlotWidth };
      continue;
    }

    // 한 박자 슬롯 안에 음표가 여러 개. 그 슬롯 폭 안에서 광학 분배.
    // 단, 박자 경계를 넘는 음표가 섞여 있으면(예: 8분+점8분) 광학 분배 결과가 다음 박자 슬롯을
    // 침범할 수는 있으나(slotWidth 자체가 늘어남), 다음 박자 슬롯의 시작 offset은 변하지 않으므로
    // 박자 격자 정렬은 보존된다.
    const subBeats = indices.map((i) => beatsList[i] ?? 0);
    const subRequired = indices.map((i) => requiredWidths[i] ?? 0);
    const sub = distributeNotes(subBeats, subRequired, beatSlotWidth, opts);
    for (let k = 0; k < indices.length; k += 1) {
      const i = indices[k]!;
      const s = sub[k]!;
      slots[i] = { offset: groupOffsetX + s.offset, slotWidth: s.slotWidth };
    }
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
