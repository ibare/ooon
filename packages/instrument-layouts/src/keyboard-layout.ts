import { midiToPitch } from '@oon/core';
import type { KeyLayout, KeyboardLayout } from './types.js';

export interface KeyboardLayoutOptions {
  lowMidi?: number;
  highMidi?: number;
  whiteKeyWidth?: number;
  whiteKeyHeight?: number;
  blackKeyHeightRatio?: number;
  /** 검은 건반 폭 / 흰 건반 폭 비율 (기본 0.58) */
  blackKeyWidthRatio?: number;
  highlighted?: ReadonlySet<number>;
  showLabels?: boolean;
}

const BLACK_PC: ReadonlySet<number> = new Set([1, 3, 6, 8, 10]);
const DEFAULT_BLACK_KEY_WIDTH_RATIO = 0.58;
const DEFAULT_BLACK_KEY_HEIGHT_RATIO = 0.62;

function isBlack(midi: number): boolean {
  return BLACK_PC.has(((midi % 12) + 12) % 12);
}

export function calculateKeyboardLayout(opts: KeyboardLayoutOptions = {}): KeyboardLayout {
  const lowMidi = opts.lowMidi ?? 48;
  const highMidi = opts.highMidi ?? 72;
  const whiteWidth = opts.whiteKeyWidth ?? 24;
  const whiteHeight = opts.whiteKeyHeight ?? 120;
  const blackHeight = whiteHeight * (opts.blackKeyHeightRatio ?? DEFAULT_BLACK_KEY_HEIGHT_RATIO);
  const blackWidthRatio = opts.blackKeyWidthRatio ?? DEFAULT_BLACK_KEY_WIDTH_RATIO;
  const highlighted = opts.highlighted ?? new Set<number>();
  const showLabels = opts.showLabels ?? false;

  const keys: KeyLayout[] = [];
  let whiteCursor = 0;
  const whiteByMidi = new Map<number, number>();

  for (let m = lowMidi; m <= highMidi; m++) {
    if (!isBlack(m)) {
      whiteByMidi.set(m, whiteCursor);
      const x = whiteCursor * whiteWidth;
      const pitch = midiToPitch(m);
      const key: KeyLayout = {
        midi: m,
        isBlack: false,
        rect: { x, y: 0, width: whiteWidth, height: whiteHeight },
        highlighted: highlighted.has(m),
      };
      if (showLabels) key.label = pitch;
      keys.push(key);
      whiteCursor += 1;
    }
  }

  const blackWidth = whiteWidth * blackWidthRatio;
  for (let m = lowMidi; m <= highMidi; m++) {
    if (isBlack(m)) {
      const leftWhite = whiteByMidi.get(m - 1);
      if (leftWhite === undefined) continue;
      const x = (leftWhite + 1) * whiteWidth - blackWidth / 2;
      const pitch = midiToPitch(m);
      const key: KeyLayout = {
        midi: m,
        isBlack: true,
        rect: { x, y: 0, width: blackWidth, height: blackHeight },
        highlighted: highlighted.has(m),
      };
      if (showLabels) key.label = pitch;
      keys.push(key);
    }
  }

  return {
    width: whiteCursor * whiteWidth,
    height: whiteHeight,
    keys,
    lowMidi,
    highMidi,
  };
}

const DEFAULT_LOW_MIDI = 48; // C3
const DEFAULT_HIGH_MIDI = 72; // C5

/**
 * 등장 음정 MIDI 집합으로부터 키보드 음역을 산출한다.
 * - 옥타브 경계로 정렬: 최저음 옥타브의 C부터 최고음 옥타브의 B까지.
 * - 입력이 비면 기본 C3–C5.
 * - 옵션 padOctaves로 양쪽에 옥타브 단위 여유를 더할 수 있다.
 */
export function deriveKeyboardRange(
  midis: readonly number[],
  opts: { padOctaves?: number; minLow?: number; maxHigh?: number } = {},
): { lowMidi: number; highMidi: number } {
  if (midis.length === 0) {
    return { lowMidi: DEFAULT_LOW_MIDI, highMidi: DEFAULT_HIGH_MIDI };
  }
  const pad = opts.padOctaves ?? 0;
  const min = Math.min(...midis);
  const max = Math.max(...midis);
  const lowOctC = Math.floor(min / 12) * 12 - pad * 12;
  const highOctB = Math.floor(max / 12) * 12 + 11 + pad * 12;
  const minLow = opts.minLow ?? 0;
  const maxHigh = opts.maxHigh ?? 127;
  return {
    lowMidi: Math.max(minLow, lowOctC),
    highMidi: Math.min(maxHigh, highOctB),
  };
}
