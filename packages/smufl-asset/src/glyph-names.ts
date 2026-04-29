/**
 * 사용 글리프 단일 출처. 추출 스크립트는 이 목록만 메타데이터에서 추려낸다.
 * 키는 SMuFL 표준 이름과 일치한다.
 */
export const GLYPH_NAMES = [
  'gClef',
  'fClef',
  'cClef',

  'timeSig0',
  'timeSig1',
  'timeSig2',
  'timeSig3',
  'timeSig4',
  'timeSig5',
  'timeSig6',
  'timeSig7',
  'timeSig8',
  'timeSig9',
  'timeSigCommon',
  'timeSigCutCommon',

  'noteheadWhole',
  'noteheadHalf',
  'noteheadBlack',

  'flag8thUp',
  'flag8thDown',
  'flag16thUp',
  'flag16thDown',

  'restWhole',
  'restHalf',
  'restQuarter',
  'rest8th',
  'rest16th',

  'augmentationDot',

  'accidentalSharp',
  'accidentalFlat',
  'accidentalNatural',
  'accidentalDoubleSharp',
  'accidentalDoubleFlat',
] as const;

export type GlyphName = (typeof GLYPH_NAMES)[number];

export const BRAVURA_FONT_FAMILY = 'Bravura';
