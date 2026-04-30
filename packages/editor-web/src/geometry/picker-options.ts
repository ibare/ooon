import { durationToBeats, isDurationSymbol } from '@oon/core';

// 후보 duration 심볼. 픽커는 이 순서대로 노출하되, 남은 박자(remainBeats)에
// 들어맞는 것만 보여준다(점음표 포함, 8/16분음 가독성 유지).
const CANDIDATES = ['w', 'h.', 'h', 'q.', 'q', 'e.', 'e', 's.', 's'] as const;
export type DurationCandidate = (typeof CANDIDATES)[number];

export interface PickerOption {
  duration: DurationCandidate;
  beats: number;
  /** 0–1 비율(전체 마디 박자 대비). UI 막대 길이에 사용. */
  ratio: number;
  /** SMuFL 글리프 hint(머리 모양). */
  headGlyph: 'noteheadBlack' | 'noteheadHalf' | 'noteheadWhole';
}

export interface BuildOptionsInput {
  remainBeats: number;
  beatsPerBar: number;
}

export function buildPickerOptions({ remainBeats, beatsPerBar }: BuildOptionsInput): PickerOption[] {
  if (remainBeats <= 0 || beatsPerBar <= 0) return [];
  const out: PickerOption[] = [];
  for (const d of CANDIDATES) {
    if (!isDurationSymbol(d)) continue;
    const beats = durationToBeats(d);
    if (beats > remainBeats + 1e-9) continue;
    out.push({
      duration: d,
      beats,
      ratio: beats / beatsPerBar,
      headGlyph: headGlyphFor(d),
    });
  }
  return out;
}

function headGlyphFor(d: DurationCandidate): PickerOption['headGlyph'] {
  if (d === 'w') return 'noteheadWhole';
  if (d === 'h' || d === 'h.') return 'noteheadHalf';
  return 'noteheadBlack';
}
