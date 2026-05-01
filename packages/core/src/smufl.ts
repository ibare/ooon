export const SMUFL = {
  gClef: '\uE050',
  fClef: '\uE062',
  cClef: '\uE05C',

  // 박자 분자/분모 숫자(N자리). 12/8 같은 두 자리도 처리되도록 자릿수만큼 SMUFL digit
  // 글리프(-)를 합성한다. 폰트가 자리별 advance를 가지므로 그대로 drawText에 넘기면
  // 두 자리가 가로로 나란히 그려진다.
  timeSigNumber: (n: number): string => {
    if (n < 0 || !Number.isInteger(n)) throw new Error(`Invalid time sig number: ${n}`);
    return String(n)
      .split('')
      .map((ch) => String.fromCharCode(0xe080 + Number(ch)))
      .join('');
  },
  timeSigCommon: '\uE08A',
  timeSigCutCommon: '\uE08B',

  noteheadWhole: '\uE0A2',
  noteheadHalf: '\uE0A3',
  noteheadBlack: '\uE0A4',

  // \uC644\uC131 \uC74C\uD45C(stem/flag \uD3EC\uD568). picker\uCC98\uB7FC \uD55C \uAE00\uB9AC\uD504\uB85C \uC74C\uAC00\uB97C \uBCF4\uC5EC\uC918\uC57C \uD560 \uB54C \uC0AC\uC6A9.
  noteWhole: '\uE1D2',
  noteHalfUp: '\uE1D3',
  noteQuarterUp: '\uE1D5',
  note8thUp: '\uE1D7',
  note16thUp: '\uE1D9',

  flag8thUp: '\uE240',
  flag8thDown: '\uE241',
  flag16thUp: '\uE242',
  flag16thDown: '\uE243',

  restWhole: '\uE4E3',
  restHalf: '\uE4E4',
  restQuarter: '\uE4E5',
  rest8th: '\uE4E6',
  rest16th: '\uE4E7',

  augmentationDot: '\uE1E7',

  accidentalSharp: '\uE262',
  accidentalFlat: '\uE260',
  accidentalNatural: '\uE261',
  accidentalDoubleSharp: '\uE263',
  accidentalDoubleFlat: '\uE264',
} as const;

export type GlyphName = keyof typeof SMUFL;

export const BRAVURA_FONT_FAMILY = 'Bravura';
