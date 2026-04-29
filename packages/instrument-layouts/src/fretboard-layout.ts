import type { FretboardNode } from '@oon/core';
import type {
  FretboardDotLayout,
  FretboardFretLine,
  FretboardLayout,
  FretboardStringLine,
} from './types.js';

export interface FretboardLayoutOptions {
  width: number;
  height?: number;
  paddingX?: number;
  paddingY?: number;
  equalFrets?: boolean;
  dotRadius?: number;
}

export function calculateFretboardLayout(
  node: FretboardNode,
  opts: FretboardLayoutOptions,
): FretboardLayout {
  const width = opts.width;
  const height = opts.height ?? 180;
  const padX = opts.paddingX ?? 32;
  const padY = opts.paddingY ?? 30;
  const dotRadius = opts.dotRadius ?? 10;
  const equalFrets = opts.equalFrets ?? true;

  const [lowFret, highFret] = node.fretRange;
  const fretCount = highFret - lowFret;
  const stringCount = node.tuning.length;

  const areaLeft = padX;
  const areaRight = width - padX;
  const areaWidth = areaRight - areaLeft;

  const fretX: number[] = [];
  if (equalFrets) {
    for (let i = 0; i <= fretCount; i++) fretX.push(areaLeft + (i / fretCount) * areaWidth);
  } else {
    const ratios: number[] = [0];
    let accum = 0;
    for (let i = 0; i < fretCount; i++) {
      const segLen = Math.pow(2, -(lowFret + i) / 12) - Math.pow(2, -(lowFret + i + 1) / 12);
      accum += segLen;
      ratios.push(accum);
    }
    const total = accum;
    for (let i = 0; i <= fretCount; i++) {
      fretX.push(areaLeft + ((ratios[i] ?? 0) / total) * areaWidth);
    }
  }

  const stringYStep = (height - padY * 2) / Math.max(stringCount - 1, 1);
  const stringYs: number[] = [];
  for (let s = 0; s < stringCount; s++) stringYs.push(padY + s * stringYStep);

  const strings: FretboardStringLine[] = stringYs.map((y, i) => ({ stringIndex: i, y }));

  const frets: FretboardFretLine[] = fretX.map((x, i) => ({ fret: lowFret + i, x }));

  const fretLabels: { fret: number; x: number; y: number }[] = [];
  for (let i = 0; i < fretX.length; i++) {
    const fretNum = lowFret + i;
    if (fretNum === 0) continue;
    if ([3, 5, 7, 9, 12, 15, 17, 19, 21, 24].includes(fretNum)) {
      const prev = fretX[i - 1];
      const curr = fretX[i];
      if (prev === undefined || curr === undefined) continue;
      fretLabels.push({ fret: fretNum, x: (prev + curr) / 2, y: height - 6 });
    }
  }

  const dots: FretboardDotLayout[] = node.dots
    .filter((d) => d.fret >= lowFret && d.fret <= highFret && d.string < stringCount)
    .map((d) => {
      const relFret = d.fret - lowFret;
      const prevX = d.fret === lowFret ? fretX[0] : fretX[relFret - 1];
      const currX = fretX[relFret];
      if (prevX === undefined || currX === undefined) {
        throw new Error(`Fret x lookup failed for fret ${d.fret}`);
      }
      const x = d.fret === lowFret ? prevX : (prevX + currX) / 2;
      const y = stringYs[d.string] ?? 0;
      return { string: d.string, fret: d.fret, x, y, note: d.note, isRoot: d.isRoot, midi: d.midiNote };
    });

  void dotRadius;

  const layout: FretboardLayout = {
    width,
    height,
    strings,
    frets,
    dots,
    fretLabels,
  };
  if (lowFret === 0) layout.nutX = fretX[0];
  return layout;
}
