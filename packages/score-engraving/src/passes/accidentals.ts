import { parsePitch, type NoteEvent, type NoteLetter } from '@oon/core';
import type { KeySignatureMap } from './key-signature.js';

// 표시할 임시표 종류. null이면 글리프를 붙이지 않는다.
export type AccidentalKind =
  | 'doubleFlat'
  | 'flat'
  | 'natural'
  | 'sharp'
  | 'doubleSharp'
  | null;

export interface AccidentalDecision {
  // bar 안 음표 인덱스(rest 포함) — bar.notes와 정합.
  noteIndex: number;
  // 화음 1급 표현: NoteEvent.pitches와 동일 길이의 배열. 단음=[kind 1개], 화음=[k1, k2, ...], 쉼표=[].
  // letter+octave 슬롯 carry-over는 화음 안에서도 left→right 순서로 갱신된다.
  kinds: AccidentalKind[];
}

function kindFromAlteration(alt: number, current: number): AccidentalKind {
  if (alt === current) return null;
  switch (alt) {
    case 2:
      return 'doubleSharp';
    case 1:
      return 'sharp';
    case 0:
      return 'natural';
    case -1:
      return 'flat';
    case -2:
      return 'doubleFlat';
    default:
      return null;
  }
}

// 마디 안 임시표 표시 여부를 결정한다.
// 규약:
//   - 마디 시작 시 letter+octave별 상태를 keySig으로 초기화(octave 무관 letter 단위로 적용).
//   - 음표가 letter+octave 슬롯의 현재 alteration과 다른 alteration으로 표기되면 글리프 표시.
//   - 같은 슬롯에서 같은 alteration이 다시 등장하면 글리프 생략(carry-over).
//   - rest는 상태에 영향을 주지 않는다.
export function resolveAccidentals(
  notes: readonly NoteEvent[],
  keySig: KeySignatureMap,
): AccidentalDecision[] {
  const state = new Map<string, number>();
  const out: AccidentalDecision[] = [];
  for (let i = 0; i < notes.length; i += 1) {
    const note = notes[i];
    if (!note || note.isRest) {
      out.push({ noteIndex: i, kinds: [] });
      continue;
    }
    const kinds: AccidentalKind[] = [];
    for (const pitch of note.pitches) {
      const parsed = parsePitch(pitch);
      const slot = `${parsed.letter}${parsed.octave}`;
      const current = state.get(slot) ?? keySig[parsed.letter as NoteLetter] ?? 0;
      const kind = kindFromAlteration(parsed.accidental, current);
      if (parsed.accidental !== current) state.set(slot, parsed.accidental);
      kinds.push(kind);
    }
    out.push({ noteIndex: i, kinds });
  }
  return out;
}
