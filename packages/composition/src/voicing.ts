import { chordVoicing, pitchClassOf, type SongChord } from '@oon/core';

/** root을 항상 octave 3에 두는 root-position voicing의 기준 MIDI(C3). */
const ROOT_OCTAVE_BASE_MIDI = 48;

/**
 * Song chord를 결정론적 고정 옥타브 root-position voicing으로 변환한다.
 * - root MIDI = 48 + pitchClass(root) → C3..B3 범위
 * - intervals 그대로 적용해 voicing MIDI 배열 산출(triad는 3개, 7th는 4개 등)
 * - root 미해석 시 chord.notes의 pitch class만 같은 옥타브 기준으로 폴백
 */
export function chooseChordVoicingMidis(chord: SongChord): number[] {
  try {
    const rootPc = pitchClassOf(chord.root);
    const rootMidi = ROOT_OCTAVE_BASE_MIDI + rootPc;
    return chordVoicing(chord, rootMidi);
  } catch {
    const out: number[] = [];
    const seen = new Set<number>();
    for (const cn of chord.notes) {
      try {
        const pc = pitchClassOf(cn);
        if (!seen.has(pc)) {
          seen.add(pc);
          out.push(ROOT_OCTAVE_BASE_MIDI + pc);
        }
      } catch {
        // skip unparsable token
      }
    }
    return out;
  }
}
