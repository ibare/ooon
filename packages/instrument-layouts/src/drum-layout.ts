import type { DrumNode, DrumTrackKey } from '@oon/core';
import type { DrumCellLayout, DrumLayout } from './types.js';

export interface DrumLayoutOptions {
  width: number;
  trackHeight?: number;
  labelWidth?: number;
  cellPadding?: number;
}

const TRACK_LABELS: Record<DrumTrackKey, string> = {
  HH: 'Hi-Hat',
  SN: 'Snare',
  KK: 'Kick',
  TM: 'Tom',
  CR: 'Crash',
  RD: 'Ride',
};

export function calculateDrumLayout(node: DrumNode, opts: DrumLayoutOptions): DrumLayout {
  const width = opts.width;
  const trackHeight = opts.trackHeight ?? 32;
  const labelWidth = opts.labelWidth ?? 56;
  const cellPadding = opts.cellPadding ?? 2;

  const trackEntries = Object.entries(node.tracks).filter(
    (entry): entry is [DrumTrackKey, boolean[]] => entry[1] !== undefined,
  );

  const tracks: DrumLayout['tracks'] = trackEntries.map(([name], i) => ({
    name,
    y: i * trackHeight,
    height: trackHeight,
    label: TRACK_LABELS[name],
  }));

  const resolution = node.resolution || 16;
  const barCount = Math.max(node.barCount, 1);
  const gridWidth = width - labelWidth;
  const cellWidth = gridWidth / (resolution * barCount);

  const cells: DrumCellLayout[] = [];
  const barDividers: DrumLayout['barDividers'] = [];
  const beatDividers: DrumLayout['beatDividers'] = [];

  const totalHeight = trackEntries.length * trackHeight;

  for (let b = 0; b <= barCount; b++) {
    barDividers.push({
      x: labelWidth + b * resolution * cellWidth,
      yTop: 0,
      yBottom: totalHeight,
    });
  }

  const beatsPerBar = node.timeSignature.beats;
  const cellsPerBeat = resolution / beatsPerBar;
  for (let b = 0; b < barCount; b++) {
    for (let beat = 1; beat < beatsPerBar; beat++) {
      beatDividers.push({
        x: labelWidth + (b * resolution + beat * cellsPerBeat) * cellWidth,
        yTop: 0,
        yBottom: totalHeight,
      });
    }
  }

  for (let ti = 0; ti < trackEntries.length; ti++) {
    const entry = trackEntries[ti];
    if (!entry) continue;
    const [trackName, cellsArr] = entry;
    const y = ti * trackHeight + cellPadding;
    const h = trackHeight - cellPadding * 2;
    for (let ci = 0; ci < cellsArr.length; ci++) {
      const bi = Math.floor(ci / resolution);
      const inBar = ci % resolution;
      const x = labelWidth + ci * cellWidth + cellPadding;
      cells.push({
        track: trackName,
        trackIndex: ti,
        barIndex: bi,
        cellIndex: inBar,
        x,
        y,
        width: cellWidth - cellPadding * 2,
        height: h,
        active: cellsArr[ci] === true,
      });
    }
  }

  return { width, height: totalHeight, tracks, cells, barDividers, beatDividers };
}
