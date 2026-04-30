import type { Projector } from '@oon/shared';
import type { DrumLayout, DrumCellLayout } from '@oon/instrument-layouts';
import { CanvasProjector } from '../canvas-projector.js';
import { DRUM_TRACK_COLOR, FONT, METRICS, THEME } from '../theme.js';

export interface DrumRenderOptions {
  originX?: number;
  originY?: number;
  /** 라벨 표시 여부. song 내 system 라벨은 첫 system에만 표시할 때 false 전달. */
  showLabels?: boolean;
  /** 재생 중이면 활성 셀에 글로우 + 비활성 셀에 외곽선 효과를 그린다. */
  playing?: boolean;
  /** 현재 재생 중인 절대 step(16분음표 단위). cell.barIndex*resolution + cell.cellIndex와 비교. */
  activeStep?: number;
}

type TrackGroup = 'top' | 'mid' | 'bottom';

const TRACK_GROUP: Record<string, TrackGroup> = {
  HH: 'top',
  CR: 'top',
  RD: 'top',
  SN: 'mid',
  TM: 'mid',
  KK: 'bottom',
};

const STRONG_BEAT_FILL = 'rgba(0,0,0,0.015)';
const BEAT_GROUP_LINE = 'rgba(0,0,0,0.04)';
const BAR_DIVIDER_LINE = 'rgba(0,0,0,0.08)';

function activeFillFor(track: string): string {
  const c = DRUM_TRACK_COLOR[track];
  if (c) return c.on;
  switch (TRACK_GROUP[track]) {
    case 'top':
      return THEME.drumCellTop;
    case 'mid':
      return THEME.drumCellMid;
    case 'bottom':
      return THEME.drumCellBottom;
    default:
      return THEME.drumCellMid;
  }
}

function inactiveFillFor(track: string): string {
  const c = DRUM_TRACK_COLOR[track];
  if (c) return c.off;
  return THEME.drumCellInactive;
}

export function renderDrum(
  projector: Projector,
  layout: DrumLayout,
  opts: DrumRenderOptions = {},
): void {
  const ox = opts.originX ?? 0;
  const oy = opts.originY ?? 0;
  const showLabels = opts.showLabels ?? true;
  const playing = opts.playing ?? false;
  const activeStep = opts.activeStep;

  projector.save();
  projector.translate(ox, oy);

  if (projector instanceof CanvasProjector) {
    drawRich(projector, layout, showLabels, playing, activeStep);
  } else {
    drawFlat(projector, layout, showLabels);
  }

  for (const cell of layout.cells) {
    projector.registerHitArea(
      `drum:${cell.track}:${cell.barIndex}:${cell.cellIndex}`,
      { x: cell.x, y: cell.y, width: cell.width, height: cell.height },
      'pointer',
    );
  }

  projector.restore();
}

function drawRich(
  projector: CanvasProjector,
  layout: DrumLayout,
  showLabels: boolean,
  playing: boolean,
  activeStep: number | undefined,
): void {
  projector.withCanvas2D((ctx) => {
    const cellsPerBeat = layout.resolution / layout.beatsPerBar;

    drawStrongBeatShading(ctx, layout, cellsPerBeat);

    for (const cell of layout.cells) {
      drawCell(ctx, cell, layout, cellsPerBeat, playing, activeStep);
    }

    drawBeatGroupLines(ctx, layout, cellsPerBeat);
    drawBarDividers(ctx, layout);

    if (showLabels) drawLabels(ctx, layout);
  });
}

function drawStrongBeatShading(
  ctx: CanvasRenderingContext2D,
  layout: DrumLayout,
  cellsPerBeat: number,
): void {
  if (layout.cells.length === 0) return;
  const trackY = 0;
  const totalHeight = layout.height;
  ctx.save();
  ctx.fillStyle = STRONG_BEAT_FILL;

  const cellsByBar: Map<number, DrumCellLayout[]> = new Map();
  for (const cell of layout.cells) {
    if (cell.trackIndex !== 0) continue;
    if (!cellsByBar.has(cell.barIndex)) cellsByBar.set(cell.barIndex, []);
    cellsByBar.get(cell.barIndex)!.push(cell);
  }

  for (const [, cells] of cellsByBar) {
    const sorted = [...cells].sort((a, b) => a.cellIndex - b.cellIndex);
    const beat1Start = sorted[0]?.x;
    const beat1End =
      sorted[Math.floor(cellsPerBeat) - 1]?.x !== undefined
        ? sorted[Math.floor(cellsPerBeat) - 1]!.x + sorted[Math.floor(cellsPerBeat) - 1]!.width
        : undefined;
    const beat3StartIdx = Math.floor(cellsPerBeat * 2);
    const beat3EndIdx = Math.floor(cellsPerBeat * 3) - 1;
    const beat3Start = sorted[beat3StartIdx]?.x;
    const beat3End =
      sorted[beat3EndIdx]?.x !== undefined
        ? sorted[beat3EndIdx]!.x + sorted[beat3EndIdx]!.width
        : undefined;

    if (beat1Start !== undefined && beat1End !== undefined) {
      ctx.fillRect(beat1Start, trackY, beat1End - beat1Start, totalHeight);
    }
    if (beat3Start !== undefined && beat3End !== undefined) {
      ctx.fillRect(beat3Start, trackY, beat3End - beat3Start, totalHeight);
    }
  }
  ctx.restore();
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  cell: DrumCellLayout,
  layout: DrumLayout,
  cellsPerBeat: number,
  playing: boolean,
  activeStep: number | undefined,
): void {
  const gap = METRICS.drumCellGap;
  const x = cell.x + gap / 2;
  const y = cell.y + gap / 2;
  const w = Math.max(0, cell.width - gap);
  const h = Math.max(0, cell.height - gap);
  if (w <= 0 || h <= 0) return;
  const r = Math.min(METRICS.drumCellRichRadius, w / 2, h / 2);

  const onColor = activeFillFor(cell.track);
  const offColor = inactiveFillFor(cell.track);
  const stepIndex = cell.barIndex * layout.resolution + cell.cellIndex;
  const isCurrentStep =
    playing && activeStep !== undefined && Math.floor(activeStep) === stepIndex;

  if (cell.active) {
    ctx.save();
    if (isCurrentStep) {
      ctx.shadowColor = onColor;
      ctx.shadowBlur = 8;
    } else {
      ctx.globalAlpha = 0.7;
    }
    pathRoundRect(ctx, x, y, w, h, r);
    ctx.fillStyle = onColor;
    ctx.fill();
    ctx.restore();

    const topH = h * 0.3;
    if (topH > 0.5) {
      ctx.save();
      pathRoundRectTopOnly(ctx, x, y, w, topH, r);
      ctx.fillStyle = isCurrentStep
        ? 'rgba(255,255,255,0.3)'
        : 'rgba(255,255,255,0.12)';
      ctx.fill();
      ctx.restore();
    }
    return;
  }

  pathRoundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = offColor;
  ctx.fill();

  if (isCurrentStep) {
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = onColor;
    pathRoundRect(ctx, x, y, w, h, r);
    ctx.stroke();
    ctx.restore();
  }

  void cellsPerBeat;
}

function drawBeatGroupLines(
  ctx: CanvasRenderingContext2D,
  layout: DrumLayout,
  cellsPerBeat: number,
): void {
  if (layout.beatDividers.length === 0) return;
  ctx.save();
  ctx.strokeStyle = BEAT_GROUP_LINE;
  ctx.lineWidth = 0.5;
  for (const div of layout.beatDividers) {
    ctx.beginPath();
    ctx.moveTo(div.x, div.yTop);
    ctx.lineTo(div.x, div.yBottom);
    ctx.stroke();
  }
  ctx.restore();
  void cellsPerBeat;
}

function drawBarDividers(ctx: CanvasRenderingContext2D, layout: DrumLayout): void {
  if (layout.barDividers.length === 0) return;
  ctx.save();
  ctx.strokeStyle = BAR_DIVIDER_LINE;
  ctx.lineWidth = 0.7;
  for (const div of layout.barDividers) {
    ctx.beginPath();
    ctx.moveTo(div.x, div.yTop);
    ctx.lineTo(div.x, div.yBottom);
    ctx.stroke();
  }
  ctx.restore();
}

function drawLabels(ctx: CanvasRenderingContext2D, layout: DrumLayout): void {
  if (layout.cells.length === 0) return;
  let leftMost = Infinity;
  for (const cell of layout.cells) {
    if (cell.x < leftMost) leftMost = cell.x;
  }
  if (!isFinite(leftMost)) return;

  ctx.save();
  ctx.textBaseline = 'middle';
  for (const track of layout.tracks) {
    const cy = track.y + track.height / 2;
    const dotR = 3;
    const dotX = Math.max(8, leftMost - 28);
    const c = DRUM_TRACK_COLOR[track.name];
    ctx.fillStyle = c?.on ?? activeFillFor(track.name);
    ctx.beginPath();
    ctx.arc(dotX, cy, dotR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = THEME.muted;
    ctx.font = `bold 9px ${FONT.ui}`;
    ctx.textAlign = 'left';
    ctx.fillText(track.name, dotX + dotR + 4, cy);
  }
  ctx.restore();
}

function pathRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  if (r > 0) ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  if (r > 0) ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  if (r > 0) ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  if (r > 0) ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function pathRoundRectTopOnly(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  if (r > 0) ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + r);
  if (r > 0) ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawFlat(
  projector: Projector,
  layout: DrumLayout,
  showLabels: boolean,
): void {
  if (showLabels) {
    for (const track of layout.tracks) {
      projector.drawText(
        track.label,
        { x: 8, y: track.y + track.height / 2 },
        { font: FONT.ui, fontSize: 12, fill: THEME.muted, baseline: 'middle' },
      );
    }
  }

  for (const cell of layout.cells) {
    const rect = { x: cell.x, y: cell.y, width: cell.width, height: cell.height };
    projector.drawRect(
      rect,
      THEME.drumCellInactive,
      THEME.grid,
      METRICS.stroke,
      METRICS.drumCellRadius,
    );
  }

  const inset = METRICS.drumCellActiveInset;
  for (const cell of layout.cells) {
    if (!cell.active) continue;
    const tile = {
      x: cell.x + inset,
      y: cell.y + inset,
      width: Math.max(0, cell.width - inset * 2),
      height: Math.max(0, cell.height - inset * 2),
    };
    if (tile.width <= 0 || tile.height <= 0) continue;
    projector.drawRect(
      tile,
      activeFillFor(cell.track),
      undefined,
      0,
      METRICS.drumCellActiveRadius,
    );
  }

  for (const divider of layout.beatDividers) {
    projector.drawLine(
      { x: divider.x, y: divider.yTop },
      { x: divider.x, y: divider.yBottom },
      THEME.grid,
      METRICS.stroke,
    );
  }
  for (const divider of layout.barDividers) {
    projector.drawLine(
      { x: divider.x, y: divider.yTop },
      { x: divider.x, y: divider.yBottom },
      THEME.drumBarline,
      METRICS.drumBarlineWidth,
    );
  }
}
