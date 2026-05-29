import type { ScoreStaff } from '@ooon/score-engraving';

// score-engraving/passes/vertical.ts: noteY(step) = centerY + (b4Step - step) * 0.5 * pxPerSp
// 역함수: step = b4Step - (y - centerY) * 2 / pxPerSp
// step은 letterStep(C0=0)으로, octave*7 + LETTER_INDEX[letter].

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
type Letter = (typeof LETTERS)[number];
const B4_STEP = 4 * 7 + 6; // letter='B', octave=4

const STAFF_KEY_TO_INDEX: Record<Letter, number> = {
  C: 0,
  D: 1,
  E: 2,
  F: 3,
  G: 4,
  A: 5,
  B: 6,
};

export interface InversePitchInput {
  /** 콘텐츠 좌표 y(px) */
  y: number;
  staff: ScoreStaff;
}

export interface InversePitchResult {
  /** letterStep (정수) */
  step: number;
  /** y가 가장 가까운 step에 스냅된 픽셀 좌표 */
  snappedY: number;
  pitch: string;
  letter: Letter;
  octave: number;
}

export function pitchAt(input: InversePitchInput): InversePitchResult {
  const { y, staff } = input;
  const pxPerSp = staff.lineGap;
  const centerY = (staff.top + staff.bottom) / 2;
  const rawStep = B4_STEP - ((y - centerY) * 2) / pxPerSp;
  const step = Math.round(rawStep);
  const snappedY = centerY + (B4_STEP - step) * 0.5 * pxPerSp;
  const octave = Math.floor(step / 7);
  const letter = LETTERS[step - octave * 7]!;
  return { step, snappedY, pitch: `${letter}${octave}`, letter, octave };
}

export function letterToStep(letter: Letter, octave: number): number {
  return octave * 7 + STAFF_KEY_TO_INDEX[letter];
}
