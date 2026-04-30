import { noteName, pitchClassOf } from './notes.js';
import { buildScale, type ScaleType } from './scales.js';

export type Mode = 'major' | 'minor';

const ROMAN_DEGREES: Record<string, number> = {
  I: 0,
  II: 1,
  III: 2,
  IV: 3,
  V: 4,
  VI: 5,
  VII: 6,
};

export class RomanParseError extends Error {
  constructor(input: string) {
    super(`Invalid roman numeral: ${input}`);
    this.name = 'RomanParseError';
  }
}

export interface ResolvedRoman {
  roman: string;
  symbol: string;
  root: string;
  quality: string;
  notes: readonly string[];
}

const ROMAN_RE = /^(b|#)?([ivIV]+)(°|o|\+|maj7|m7b5|dim7|dim|aug|m7|7|sus4|sus2|6|m6|9|add9|m)?$/;

export function resolveRoman(input: string, key: string, mode: Mode): ResolvedRoman {
  const m = ROMAN_RE.exec(input.trim());
  if (!m) throw new RomanParseError(input);
  const accidental = m[1] ?? '';
  const numeral = m[2] ?? '';
  const qualityExt = m[3] ?? '';

  const upperNumeral = numeral.toUpperCase();
  const degree = ROMAN_DEGREES[upperNumeral];
  if (degree === undefined) throw new RomanParseError(input);

  const isUpper = numeral === upperNumeral;
  const scaleType: ScaleType = mode === 'major' ? 'major' : 'minor';
  const scale = buildScale(key, scaleType);

  const intervals = scale.intervals;
  const diatonic = intervals[degree];
  if (diatonic === undefined) throw new RomanParseError(input);
  const semitoneShift = accidental === 'b' ? -1 : accidental === '#' ? 1 : 0;

  const rootPc = (pitchClassOf(key) + diatonic + semitoneShift + 12) % 12;
  const useFlats = key.includes('b') || accidental === 'b';
  const root = noteName(rootPc, useFlats);

  let quality: string;
  if (qualityExt === '°' || qualityExt === 'o' || qualityExt === 'dim') quality = 'dim';
  else if (qualityExt === '+' || qualityExt === 'aug') quality = 'aug';
  else if (qualityExt) quality = qualityExt;
  else quality = isUpper ? '' : 'm';

  const symbol = `${root}${quality}`;

  const { notes } = chordNotesForQuality(root, quality);

  return { roman: input, symbol, root, quality, notes };
}

export type RomanFunction = 'tonic' | 'subdominant' | 'dominant';

const FUNCTION_BY_DEGREE: Record<number, RomanFunction> = {
  0: 'tonic',
  1: 'subdominant',
  2: 'tonic',
  3: 'subdominant',
  4: 'dominant',
  5: 'tonic',
  6: 'dominant',
};

/**
 * 로마 숫자에서 화성 기능을 분류한다.
 * 차수 매핑: I/iii/vi → tonic, ii/IV → subdominant, V/vii° → dominant.
 * 보조 도미넌트(`V/x`, `V7/x` 등)는 dominant로 본다.
 * 인식 불가능한 입력은 null. 예외는 던지지 않는다.
 */
export function romanFunction(input: string): RomanFunction | null {
  if (!input) return null;
  const head = input.split('/')[0]?.trim() ?? '';
  if (!head) return null;
  const m = ROMAN_RE.exec(head);
  if (!m) {
    // V/x 같이 슬래시가 분리되었음에도 head가 ROMAN_RE에 안 맞으면 numeral만 추출 시도
    const fallback = /([ivIV]+)/.exec(head);
    if (!fallback) return null;
    const upper = fallback[1]!.toUpperCase();
    const deg = ROMAN_DEGREES[upper];
    return deg === undefined ? null : (FUNCTION_BY_DEGREE[deg] ?? null);
  }
  const numeral = (m[2] ?? '').toUpperCase();
  const degree = ROMAN_DEGREES[numeral];
  if (degree === undefined) return null;
  return FUNCTION_BY_DEGREE[degree] ?? null;
}

function chordNotesForQuality(root: string, quality: string): { notes: readonly string[] } {
  const map: Record<string, readonly number[]> = {
    '': [0, 4, 7],
    m: [0, 3, 7],
    dim: [0, 3, 6],
    aug: [0, 4, 8],
    '7': [0, 4, 7, 10],
    maj7: [0, 4, 7, 11],
    m7: [0, 3, 7, 10],
    m7b5: [0, 3, 6, 10],
    dim7: [0, 3, 6, 9],
    sus4: [0, 5, 7],
    sus2: [0, 2, 7],
    '6': [0, 4, 7, 9],
    m6: [0, 3, 7, 9],
    '9': [0, 4, 7, 10, 14],
    add9: [0, 4, 7, 14],
  };
  const intervals = map[quality] ?? [0, 4, 7];
  const rootPc = pitchClassOf(root);
  const useFlats = root.includes('b');
  return { notes: intervals.map((s) => noteName((rootPc + s) % 12, useFlats)) };
}
