export const SMUFL = {
  gClef: '\uE050',
  fClef: '\uE062',
  cClef: '\uE05C',

  timeSigDigit: (d: number): string => {
    if (d < 0 || d > 9 || !Number.isInteger(d)) throw new Error(`Invalid time sig digit: ${d}`);
    return String.fromCharCode(0xe080 + d);
  },
  timeSigCommon: '\uE08A',
  timeSigCutCommon: '\uE08B',

  noteheadWhole: '\uE0A2',
  noteheadHalf: '\uE0A3',
  noteheadBlack: '\uE0A4',

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
