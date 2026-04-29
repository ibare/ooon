import type { DrumNode, DrumTrackKey } from '@oon/core';
import type { DrumCellLayout, DrumLayout } from './types.js';

export interface DrumLayoutOptions {
  width: number;
  trackHeight?: number;
  labelWidth?: number;
  cellPadding?: number;
  /**
   * 셀 한 칸의 최소 폭. (width - labelWidth) / (resolution * barCount)이 이 값보다 작으면
   * minCellWidth로 클램프된다. 그 결과 layout.width가 입력 width를 초과할 수 있으며,
   * 컨테이너 측에서 가로 스크롤로 처리한다.
   */
  minCellWidth?: number;
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
  const inputWidth = opts.width;
  const trackHeight = opts.trackHeight ?? 32;
  const labelWidth = opts.labelWidth ?? 56;
  const cellPadding = opts.cellPadding ?? 0;
  const minCellWidth = opts.minCellWidth ?? 6;

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
  const totalCells = resolution * barCount;
  const fitCellWidth = (inputWidth - labelWidth) / totalCells;
  const cellWidth = Math.max(minCellWidth, fitCellWidth);
  const gridWidth = cellWidth * totalCells;
  const width = labelWidth + gridWidth;

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

  return {
    width,
    height: totalHeight,
    tracks,
    cells,
    barDividers,
    beatDividers,
    resolution,
    beatsPerBar,
  };
}

export interface DrumSystemBar {
  /** Song 전체 기준의 marker — 보통 절대 마디 번호. */
  barNumber: number;
  /** system 내부에서의 시작 X 좌표. score의 마디 X와 동일하게 주입한다. */
  x: number;
  /** 마디 폭. score의 마디 폭과 동일. */
  width: number;
}

export interface DrumSystemLayoutOptions {
  bars: DrumSystemBar[];
  /**
   * 이 system이 다루는 마디 범위에 해당하는 트랙 슬라이스.
   * 각 트랙 배열 길이는 `resolution * bars.length` 이어야 한다.
   */
  tracks: Partial<Record<DrumTrackKey, boolean[]>>;
  resolution: number;
  beatsPerBar: number;
  trackHeight?: number;
  cellPadding?: number;
}

/**
 * Score 마디 X/너비에 정렬된 drum grid를 만든다.
 * - cells는 각 마디 내부에서 `resolution`개의 균등 분할로 배치.
 * - barDividers는 마디 시작들 + 마지막 마디 끝.
 * - labelWidth는 별도로 두지 않고, 라벨은 system 좌측 여백(score의 contentStart 영역)에서 그린다.
 */
export function calculateDrumSystemLayout(opts: DrumSystemLayoutOptions): DrumLayout {
  const trackHeight = opts.trackHeight ?? 32;
  const cellPadding = opts.cellPadding ?? 0;
  const resolution = opts.resolution || 16;
  const beatsPerBar = opts.beatsPerBar;

  const trackEntries = Object.entries(opts.tracks).filter(
    (entry): entry is [DrumTrackKey, boolean[]] => entry[1] !== undefined,
  );

  const tracks: DrumLayout['tracks'] = trackEntries.map(([name], i) => ({
    name,
    y: i * trackHeight,
    height: trackHeight,
    label: TRACK_LABELS[name],
  }));

  const totalHeight = trackEntries.length * trackHeight;
  const cells: DrumCellLayout[] = [];
  const barDividers: DrumLayout['barDividers'] = [];
  const beatDividers: DrumLayout['beatDividers'] = [];

  for (let bi = 0; bi < opts.bars.length; bi++) {
    const bar = opts.bars[bi]!;
    barDividers.push({ x: bar.x, yTop: 0, yBottom: totalHeight });
  }
  if (opts.bars.length > 0) {
    const last = opts.bars[opts.bars.length - 1]!;
    barDividers.push({ x: last.x + last.width, yTop: 0, yBottom: totalHeight });
  }

  const cellsPerBeat = resolution / beatsPerBar;
  for (let bi = 0; bi < opts.bars.length; bi++) {
    const bar = opts.bars[bi]!;
    const cellWidth = bar.width / resolution;
    for (let beat = 1; beat < beatsPerBar; beat++) {
      beatDividers.push({
        x: bar.x + beat * cellsPerBeat * cellWidth,
        yTop: 0,
        yBottom: totalHeight,
      });
    }
  }

  for (let ti = 0; ti < trackEntries.length; ti++) {
    const entry = trackEntries[ti]!;
    const [trackName, cellsArr] = entry;
    const y = ti * trackHeight + cellPadding;
    const h = trackHeight - cellPadding * 2;
    for (let bi = 0; bi < opts.bars.length; bi++) {
      const bar = opts.bars[bi]!;
      const cellWidth = bar.width / resolution;
      for (let ci = 0; ci < resolution; ci++) {
        const globalCi = bi * resolution + ci;
        const x = bar.x + ci * cellWidth + cellPadding;
        cells.push({
          track: trackName,
          trackIndex: ti,
          barIndex: bi,
          cellIndex: ci,
          x,
          y,
          width: cellWidth - cellPadding * 2,
          height: h,
          active: cellsArr[globalCi] === true,
        });
      }
    }
  }

  const lastBar = opts.bars[opts.bars.length - 1];
  const width = lastBar ? lastBar.x + lastBar.width : 0;

  return {
    width,
    height: totalHeight,
    tracks,
    cells,
    barDividers,
    beatDividers,
    resolution,
    beatsPerBar,
  };
}
