import { midiToPitch } from '@oon/core';
import type { KeyLayout, KeyboardLayout } from './types.js';

export interface KeyboardLayoutOptions {
  lowMidi?: number;
  highMidi?: number;
  whiteKeyWidth?: number;
  whiteKeyHeight?: number;
  blackKeyHeightRatio?: number;
  highlighted?: ReadonlySet<number>;
  showLabels?: boolean;
}

const BLACK_PC: ReadonlySet<number> = new Set([1, 3, 6, 8, 10]);

function isBlack(midi: number): boolean {
  return BLACK_PC.has(((midi % 12) + 12) % 12);
}

export function calculateKeyboardLayout(opts: KeyboardLayoutOptions = {}): KeyboardLayout {
  const lowMidi = opts.lowMidi ?? 48;
  const highMidi = opts.highMidi ?? 72;
  const whiteWidth = opts.whiteKeyWidth ?? 24;
  const whiteHeight = opts.whiteKeyHeight ?? 120;
  const blackHeight = whiteHeight * (opts.blackKeyHeightRatio ?? 0.62);
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

  for (let m = lowMidi; m <= highMidi; m++) {
    if (isBlack(m)) {
      const leftWhite = whiteByMidi.get(m - 1);
      if (leftWhite === undefined) continue;
      const x = (leftWhite + 1) * whiteWidth - whiteWidth * 0.3;
      const pitch = midiToPitch(m);
      const key: KeyLayout = {
        midi: m,
        isBlack: true,
        rect: { x, y: 0, width: whiteWidth * 0.6, height: blackHeight },
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
