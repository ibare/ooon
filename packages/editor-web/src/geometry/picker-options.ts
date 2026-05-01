import { durationToBeats, isDurationSymbol, type GlyphName } from '@oon/core';

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
export type PickerOption = InsertNoteOption | InsertRestOption;

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

export interface BuildOptionsInput {
  remainBeats: number;
  beatsPerBar: number;
}

export function buildPickerOptions({ remainBeats, beatsPerBar }: BuildOptionsInput): PickerOption[] {
  if (remainBeats <= 0 || beatsPerBar <= 0) return [];
  const out: PickerOption[] = [];
  for (const d of NOTE_CANDIDATES) {
    if (!isDurationSymbol(d)) continue;
    const beats = durationToBeats(d);
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
    const beats = durationToBeats(d);
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
