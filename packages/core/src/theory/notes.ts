export const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

export type NoteLetter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

const LETTER_SEMITONE: Record<NoteLetter, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

export class NoteParseError extends Error {
  constructor(input: string) {
    super(`Invalid note: ${input}`);
    this.name = 'NoteParseError';
  }
}

export interface ParsedPitch {
  letter: NoteLetter;
  accidental: number;
  octave: number;
  pitchClass: number;
}

const PITCH_RE = /^([A-G])([#b]*)(-?\d+)?$/;

export function parsePitch(input: string): ParsedPitch {
  const m = PITCH_RE.exec(input.trim());
  if (!m) throw new NoteParseError(input);
  const letter = m[1] as NoteLetter;
  const accStr = m[2] ?? '';
  const octStr = m[3];
  let accidental = 0;
  for (const c of accStr) {
    if (c === '#') accidental += 1;
    else if (c === 'b') accidental -= 1;
  }
  const octave = octStr !== undefined ? Number.parseInt(octStr, 10) : 4;
  const pc = (((LETTER_SEMITONE[letter] + accidental) % 12) + 12) % 12;
  return { letter, accidental, octave, pitchClass: pc };
}

export function pitchToMidi(input: string): number {
  const p = parsePitch(input);
  return (p.octave + 1) * 12 + LETTER_SEMITONE[p.letter] + p.accidental;
}

export function midiToPitch(midi: number, useFlats = false): string {
  const octave = Math.floor(midi / 12) - 1;
  const pc = ((midi % 12) + 12) % 12;
  const names = useFlats ? FLAT_NAMES : SHARP_NAMES;
  const name = names[pc];
  if (name === undefined) throw new Error(`Invalid pitch class: ${pc}`);
  return `${name}${octave}`;
}

export function pitchToFrequency(input: string): number {
  return midiToFrequency(pitchToMidi(input));
}

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function noteName(pitchClass: number, useFlats = false): string {
  const pc = ((pitchClass % 12) + 12) % 12;
  const n = (useFlats ? FLAT_NAMES : SHARP_NAMES)[pc];
  if (n === undefined) throw new Error(`Invalid pitch class: ${pc}`);
  return n;
}

export function pitchClassOf(noteName: string): number {
  const p = parsePitch(noteName);
  return p.pitchClass;
}

export function transposePitch(input: string, semitones: number, useFlats = false): string {
  return midiToPitch(pitchToMidi(input) + semitones, useFlats);
}

// UI의 ↑/↓ 동작용 한 단계(=반음) 이동. ↑은 ♯ 우선, ↓은 ♭ 우선으로 자동 표기.
// midiToPitch가 SHARP/FLAT_NAMES 표를 쓰므로 E♯/B♯/F♭/C♭은 절대 생성되지 않는다(E↔F, B↔C는 위치만 이동).
// 시작이 ♯/♭이고 반대 방향으로 한 단계 가면 임시표가 풀린다(예: D♭ + ↑ = D, D♯ + ↓ = D).
// 옥타브 wrap도 midi 기준으로 자동 처리(B4 + ↑ = C5, C4 + ↓ = B3).
export function stepPitch(input: string, direction: 'up' | 'down'): string {
  const delta = direction === 'up' ? 1 : -1;
  return transposePitch(input, delta, direction === 'down');
}
