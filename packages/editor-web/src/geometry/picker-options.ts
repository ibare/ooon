import {
  durationToBeats,
  isDurationSymbol,
  SMUFL,
  SUPPORTED_TIME_SIGNATURES,
  transposePitch,
  type GlyphName,
  type TimeSignature,
} from '@ooon/core';
import { PICKER_DEFAULT_CHORD_INTERVAL_SEMITONES } from '../constants.js';

// 음표 후보 duration 심볼. 픽커는 이 순서대로 노출하되, 남은 박자(remainBeats)에
// 들어맞는 것만 보여준다(점음표 포함, 8/16분음 가독성 유지).
const NOTE_CANDIDATES = ['w', 'h.', 'h', 'q.', 'q', 'e.', 'e', 's.', 's'] as const;
export type DurationCandidate = (typeof NOTE_CANDIDATES)[number];

// 쉼표 후보. 음표와 동일하게 점쉼표 포함 9종.
// score-engraving의 makeDots가 음표/쉼표 분기 모두에서 호출되어 점쉼표도 정상 렌더된다.
const REST_CANDIDATES = ['w', 'h.', 'h', 'q.', 'q', 'e.', 'e', 's.', 's'] as const;
export type RestDurationCandidate = (typeof REST_CANDIDATES)[number];

// 픽커는 클릭 컨텍스트(빈 슬롯, 음표, 박자 등)에 따라 서로 다른 액션 옵션을 노출한다.
// 옵션은 `kind`로 변별되는 discriminated union — 렌더 측은 공통 시각 필드(glyph/dotted)만 보고
// 그리고, 커밋 측은 kind로 분기해 각각의 command를 dispatch한다.
export type PickerOption =
  | InsertNoteOption
  | InsertRestOption
  | ReplaceNoteOption
  | ReplaceWithRestOption
  | AddChordPitchOption
  | RemoveChordHeadOption
  | SetTimeSigOption;

export interface InsertNoteOption {
  kind: 'insertNote';
  duration: DurationCandidate;
  beats: number;
  /** SMuFL 완성 음표 글리프(stem/flag 포함). 점음표는 별도로 augmentationDot을 옆에 그린다. */
  glyph: GlyphName;
  /** 점음표 여부. 렌더 측에서 augmentationDot을 곁들일지 판단. */
  dotted: boolean;
}

export interface InsertRestOption {
  kind: 'insertRest';
  duration: RestDurationCandidate;
  beats: number;
  glyph: GlyphName;
  /** 점쉼표 여부. 렌더 측이 augmentationDot을 옆에 곁들일지 판단. */
  dotted: boolean;
}

export interface ReplaceNoteOption {
  kind: 'replaceNote';
  duration: DurationCandidate;
  beats: number;
  glyph: GlyphName;
  dotted: boolean;
}

export interface ReplaceWithRestOption {
  kind: 'replaceWithRest';
  duration: RestDurationCandidate;
  beats: number;
  glyph: GlyphName;
  dotted: boolean;
}

// ─── 음정/화음 옵션 ───────────────────────────────────────────────────────────
//
// 음정 ▲▼ 이동(transposeNote)은 picker 그리드 옵션이 아니라 picker panel 왼쪽의 독립 컬럼으로
// 분리되어 있다(picker-widget의 TransposeColumn). 클릭 시 picker가 닫히지 않고 연속 조작 가능.
// 따라서 PickerOption union에는 transpose 종류가 없으며, score-editor가 토큰
// 'picker:transpose:up'/'picker:transpose:down'을 직접 분기해 dispatch한다.
//
// addChordPitch: 클릭된 (단음 또는 화음) 음표에 새 head를 추가해 화음으로 만든다.
//   - duration은 source와 동일(같은 자리에 들어가야 하므로 박자 그대로 유지).
//   - 기본 추가 pitch는 현재 최고음 + PICKER_DEFAULT_CHORD_INTERVAL_SEMITONES(=major third).
//   - duration/glyph/dotted/beats는 source 음표의 "동일 길이" 셀 시각을 그대로 보여주기 위한
//     렌더 메타. commit 시에는 pitch만 사용한다.
export interface AddChordPitchOption {
  kind: 'addChordPitch';
  duration: DurationCandidate;
  beats: number;
  glyph: GlyphName;
  dotted: boolean;
  pitch: string;
}

// removeChordHead: 화음(pitches.length≥2)에서 특정 head 한 개 제거. 단음이면 발행하지 않음.
//   pitchIndex는 source 음표의 pitches 배열 인덱스. pitch는 라벨 표시 용도.
export interface RemoveChordHeadOption {
  kind: 'removeChordHead';
  pitchIndex: number;
  pitch: string;
}

// 박자 변경은 음표/쉼표 옵션과 시각 표현이 다르다 — 분자/분모 두 글리프를
// 위·아래로 배치해야 하므로 single glyph 필드 대신 top/bottom을 분리해 둔다.
// dotted는 박자 옵션에 무의미하지만 PickerOption 공통 분기를 단순화하지 않기 위해
// 의도적으로 두지 않는다(렌더 측이 kind로 분기).
export interface SetTimeSigOption {
  kind: 'setTimeSignature';
  timeSignature: TimeSignature;
  /** 분자 SMuFL 글리프(예: "4"). */
  topGlyph: string;
  /** 분모 SMuFL 글리프(예: "4"). */
  bottomGlyph: string;
  /** 사람 친화적 라벨(예: "4/4") — 디버그/접근성용. 렌더에는 글리프를 사용. */
  label: string;
}

export interface BuildOptionsInput {
  remainBeats: number;
  beatsPerBar: number;
  /** 박자 분모. 1박 = 1/beatValue whole note. duration 토큰을 박 수로 환산할 때 사용. */
  beatValue: number;
}

export function buildPickerOptions({
  remainBeats,
  beatsPerBar,
  beatValue,
}: BuildOptionsInput): PickerOption[] {
  if (remainBeats <= 0 || beatsPerBar <= 0) return [];
  const out: PickerOption[] = [];
  for (const d of NOTE_CANDIDATES) {
    if (!isDurationSymbol(d)) continue;
    const beats = durationToBeats(d, beatValue);
    if (beats > remainBeats + 1e-9) continue;
    out.push({
      kind: 'insertNote',
      duration: d,
      beats,
      glyph: noteGlyphFor(d),
      dotted: d.endsWith('.'),
    });
  }
  for (const d of REST_CANDIDATES) {
    if (!isDurationSymbol(d)) continue;
    const beats = durationToBeats(d, beatValue);
    if (beats > remainBeats + 1e-9) continue;
    out.push({
      kind: 'insertRest',
      duration: d,
      beats,
      glyph: restGlyphFor(d),
      dotted: d.endsWith('.'),
    });
  }
  return out;
}

export interface BuildReplaceOptionsInput {
  /** 클릭된 음표/쉼표의 duration symbol. */
  currentDuration: string;
  /** 클릭된 대상이 쉼표인지 — kind와 함께 자기 자신 식별에 사용. */
  currentIsRest: boolean;
  /** 클릭된 음표의 현재 pitches. 쉼표는 빈 배열. addChordPitch 기본값/RemoveChordHead 빌드에 사용. */
  currentPitches: readonly string[];
  /** 마디 총 박자. */
  beatsPerBar: number;
  /** 자기 자신을 제외한 마디 내 다른 음표들의 박자 합. (allowed = beatsPerBar - otherUsedBeats) */
  otherUsedBeats: number;
  /** 박자 분모. 1박 = 1/beatValue whole note. */
  beatValue: number;
}

// 음표/쉼표 클릭 시 picker가 노출할 옵션들을 빌드.
//
// 의미 반전(중요): "동일 길이 음표" 셀은 더 이상 자기 자신이라 배제하지 않는다 — 비-쉼표 source의
// 같은 duration 셀은 화음 head 추가(addChordPitch) 액션으로 발행한다. 결과적으로 사용자는 같은
// 길이를 다시 누르면 화음이 쌓이는 직관적 흐름을 얻는다.
//
// 음정 옵션(transpose ▲/▼, head 제거 ✕)도 비-쉼표 source일 때 함께 발행되어, 한 픽커 안에서
// "길이 교체" + "화음 head 추가" + "음정 이동" + "head 제거"가 공존한다(카테고리 토글로 분리 표시).
export function buildReplaceOptions({
  currentDuration,
  currentIsRest,
  currentPitches,
  beatsPerBar,
  otherUsedBeats,
  beatValue,
}: BuildReplaceOptionsInput): PickerOption[] {
  if (beatsPerBar <= 0) return [];
  const allowed = beatsPerBar - otherUsedBeats;
  if (allowed <= 0) return [];
  const out: PickerOption[] = [];
  for (const d of NOTE_CANDIDATES) {
    if (!isDurationSymbol(d)) continue;
    const beats = durationToBeats(d, beatValue);
    if (beats > allowed + 1e-9) continue;
    // 비-쉼표 source의 same duration → addChordPitch (의미 반전).
    // 쉼표 source는 화음 개념이 없으므로 same duration도 그냥 replaceNote로 발행
    // (단, 음표 종류 자체가 바뀌므로 의미가 다르지 않음).
    if (!currentIsRest && d === currentDuration) {
      const addedPitch = defaultAddedChordPitch(currentPitches);
      if (addedPitch !== null) {
        out.push({
          kind: 'addChordPitch',
          duration: d,
          beats,
          glyph: noteGlyphFor(d),
          dotted: d.endsWith('.'),
          pitch: addedPitch,
        });
      }
      continue;
    }
    out.push({
      kind: 'replaceNote',
      duration: d,
      beats,
      glyph: noteGlyphFor(d),
      dotted: d.endsWith('.'),
    });
  }
  for (const d of REST_CANDIDATES) {
    if (!isDurationSymbol(d)) continue;
    const beats = durationToBeats(d, beatValue);
    if (beats > allowed + 1e-9) continue;
    if (currentIsRest && d === currentDuration) continue;
    out.push({
      kind: 'replaceWithRest',
      duration: d,
      beats,
      glyph: restGlyphFor(d),
      dotted: d.endsWith('.'),
    });
  }
  // 음정 카테고리(그리드 옵션): 화음 head 제거만 — ▲▼ 이동은 picker 좌측 독립 컬럼이 담당.
  // 단음(=1 head)에서 마지막 head 제거는 editor-core가 거부하므로 UI에서도 옵션을 노출하지 않는다.
  if (!currentIsRest && currentPitches.length >= 2) {
    currentPitches.forEach((pitch, pitchIndex) => {
      out.push({ kind: 'removeChordHead', pitchIndex, pitch });
    });
  }
  return out;
}

// addChordPitch 기본 추가 pitch — 현재 최고음 + 장3도(상수). 쉼표/빈 배열이면 null 반환.
function defaultAddedChordPitch(currentPitches: readonly string[]): string | null {
  if (currentPitches.length === 0) return null;
  // 최고음 = 마지막 head라는 가정은 score-engraving이 stem 기준으로 정렬하긴 하지만, 모델 자체는
  // 사용자가 입력한 순서를 보존한다. 정확한 "최고음" 산정을 위해 transposePitch 비교 대신,
  // 단순히 마지막 head를 기준으로 한 단계 추가하는 휴리스틱 사용 — 사용자는 ▲▼/제거로 조정 가능.
  const top = currentPitches[currentPitches.length - 1]!;
  return transposePitch(top, PICKER_DEFAULT_CHORD_INTERVAL_SEMITONES);
}

export interface BuildTimeSigOptionsInput {
  /** 현재 박자 — 같은 박자는 후보에서 제외(무의미한 마디 초기화 방지). */
  current?: TimeSignature;
}

// 후보 목록은 코어가 단일 진실 원천(SUPPORTED_TIME_SIGNATURES, 분모순). picker는 라벨/글리프
// 매핑만 담당 — 박자 추가는 코어 카탈로그 한 곳만 수정하면 자동 반영.
export function buildTimeSigOptions({ current }: BuildTimeSigOptionsInput = {}): SetTimeSigOption[] {
  const out: SetTimeSigOption[] = [];
  for (const ts of SUPPORTED_TIME_SIGNATURES) {
    if (current && current.beats === ts.beats && current.beatValue === ts.beatValue) continue;
    out.push({
      kind: 'setTimeSignature',
      timeSignature: { beats: ts.beats, beatValue: ts.beatValue },
      topGlyph: SMUFL.timeSigNumber(ts.beats),
      bottomGlyph: SMUFL.timeSigNumber(ts.beatValue),
      label: `${ts.beats}/${ts.beatValue}`,
    });
  }
  return out;
}

function noteGlyphFor(d: DurationCandidate): GlyphName {
  if (d === 'w') return 'noteWhole';
  if (d === 'h' || d === 'h.') return 'noteHalfUp';
  if (d === 'q' || d === 'q.') return 'noteQuarterUp';
  if (d === 'e' || d === 'e.') return 'note8thUp';
  return 'note16thUp';
}

function restGlyphFor(d: RestDurationCandidate): GlyphName {
  if (d === 'w') return 'restWhole';
  if (d === 'h' || d === 'h.') return 'restHalf';
  if (d === 'q' || d === 'q.') return 'restQuarter';
  if (d === 'e' || d === 'e.') return 'rest8th';
  return 'rest16th';
}
