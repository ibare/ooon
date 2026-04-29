import type { NoteLetter } from '../../theory/notes.js';

// ─────────────────────────────────────────────────────────────────────────────
// Key signature → letter별 alteration map.
//   alteration: -2 = 더블플랫, -1 = 플랫, 0 = 자연, 1 = 샤프, 2 = 더블샤프
//   parsePitch().accidental과 동일 부호 규약.
// ─────────────────────────────────────────────────────────────────────────────

export type KeySignatureMap = Readonly<Record<NoteLetter, number>>;

const NO_ALTERATION: KeySignatureMap = { C: 0, D: 0, E: 0, F: 0, G: 0, A: 0, B: 0 };

// 메이저 키 기준 표준 임시표 순서.
const SHARPS_ORDER: readonly NoteLetter[] = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
const FLATS_ORDER: readonly NoteLetter[] = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];

// 메이저 토닉 → 임시표 개수(양수=샤프, 음수=플랫).
const MAJOR_SHARP_COUNT: Record<string, number> = {
  C: 0,
  G: 1,
  D: 2,
  A: 3,
  E: 4,
  B: 5,
  'F#': 6,
  'C#': 7,
  F: -1,
  Bb: -2,
  Eb: -3,
  Ab: -4,
  Db: -5,
  Gb: -6,
  Cb: -7,
};

// 마이너 토닉 → 평행 메이저로 정규화.
const MINOR_TO_MAJOR: Record<string, string> = {
  A: 'C',
  E: 'G',
  B: 'D',
  'F#': 'A',
  'C#': 'E',
  'G#': 'B',
  'D#': 'F#',
  'A#': 'C#',
  D: 'F',
  G: 'Bb',
  C: 'Eb',
  F: 'Ab',
  Bb: 'Db',
  Eb: 'Gb',
  Ab: 'Cb',
};

function buildFromCount(count: number): KeySignatureMap {
  const out: Record<NoteLetter, number> = { ...NO_ALTERATION };
  if (count > 0) {
    for (let i = 0; i < count; i += 1) {
      const letter = SHARPS_ORDER[i];
      if (letter !== undefined) out[letter] = 1;
    }
  } else if (count < 0) {
    for (let i = 0; i < -count; i += 1) {
      const letter = FLATS_ORDER[i];
      if (letter !== undefined) out[letter] = -1;
    }
  }
  return out;
}

// 'C', 'G', 'F', 'Bb', 'F#', 'Am', 'F#m' 등을 받아 alteration map을 반환.
// 인식 불가/undefined인 경우 모두 0인 맵을 반환한다(보수적 동작).
export function parseKeySignature(key: string | undefined): KeySignatureMap {
  if (!key) return NO_ALTERATION;
  const trimmed = key.trim();
  if (trimmed === '') return NO_ALTERATION;

  const isMinor = /m(in)?$/i.test(trimmed) && !/^[A-G][#b]?$/i.test(trimmed);
  const tonic = isMinor ? trimmed.replace(/m(in)?$/i, '') : trimmed;
  const major = isMinor ? MINOR_TO_MAJOR[tonic] : tonic;
  if (major === undefined) return NO_ALTERATION;

  const count = MAJOR_SHARP_COUNT[major];
  if (count === undefined) return NO_ALTERATION;
  return buildFromCount(count);
}
