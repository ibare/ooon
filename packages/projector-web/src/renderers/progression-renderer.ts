import type { Projector } from '@oon/shared';
import type { ProgressionLayout, ProgressionCardLayout } from '@oon/instrument-layouts';
import { romanFunction, type RomanFunction } from '@oon/core';
import { CanvasProjector } from '../canvas-projector.js';
import { FONT, FUNCTION_PALETTE, METRICS, THEME, type FunctionKey } from '../theme.js';

export interface ProgressionRenderOptions {
  originX?: number;
  originY?: number;
  showRomans?: boolean;
  /** 현재 재생 중인 마디 번호. 그 마디의 활성 chord index와 함께 활성 표현. */
  activeBarNumber?: number;
  /** 활성 마디 안에서 어느 분할 코드가 활성인지(0-based). */
  activeChordIndex?: number;
}

const SERIF_STACK = '"Newsreader", Georgia, serif';
const MONO_STACK = '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const NARROW_THRESHOLD = 80;
const SEGMENT_DASH_COLOR = 'rgba(0,0,0,0.08)';
const CARD_BORDER_COLOR = 'rgba(0,0,0,0.06)';

export function renderProgression(
  projector: Projector,
  layout: ProgressionLayout,
  opts: ProgressionRenderOptions = {},
): void {
  const ox = opts.originX ?? 0;
  const oy = opts.originY ?? 0;
  const showRomans = opts.showRomans ?? true;
  const activeBar = opts.activeBarNumber;
  const activeChord = opts.activeChordIndex ?? 0;

  projector.save();
  projector.translate(ox, oy);

  if (projector instanceof CanvasProjector) {
    drawRich(projector, layout, showRomans, activeBar, activeChord);
  } else {
    drawFlat(projector, layout, showRomans);
  }

  for (const card of layout.cards) {
    for (const chord of card.chords) {
      projector.registerHitArea(
        `chord:${card.barNumber}:${chord.symbol}`,
        chord.rect,
        'pointer',
      );
    }
  }

  projector.restore();
}

function paletteFor(roman: string | undefined): typeof FUNCTION_PALETTE[FunctionKey] {
  const fn: RomanFunction | null = roman ? romanFunction(roman) : null;
  if (fn === 'tonic') return FUNCTION_PALETTE.tonic;
  if (fn === 'subdominant') return FUNCTION_PALETTE.subdominant;
  if (fn === 'dominant') return FUNCTION_PALETTE.dominant;
  return FUNCTION_PALETTE.neutral;
}

function drawRich(
  projector: CanvasProjector,
  layout: ProgressionLayout,
  showRomans: boolean,
  activeBar: number | undefined,
  activeChordIdx: number,
): void {
  projector.withCanvas2D((ctx) => {
    for (const card of layout.cards) {
      const isActiveBar = activeBar !== undefined && card.barNumber === activeBar;
      const segCount = card.chords.length;
      for (let i = 0; i < segCount; i++) {
        const chord = card.chords[i]!;
        const palette = paletteFor(chord.roman);
        const isActive = isActiveBar && i === activeChordIdx;
        drawSegment(ctx, card, chord, i, segCount, palette, isActive, showRomans);
      }
      drawSegmentDividers(ctx, card);
    }
  });
}

function drawSegment(
  ctx: CanvasRenderingContext2D,
  card: ProgressionCardLayout,
  chord: ProgressionCardLayout['chords'][number],
  index: number,
  segCount: number,
  palette: typeof FUNCTION_PALETTE[FunctionKey],
  isActive: boolean,
  showRomans: boolean,
): void {
  const isFirst = index === 0;
  const isLast = index === segCount - 1;

  const baseRect = chord.rect;
  const dy = isActive ? -METRICS.cardPressDy : 0;
  const x = baseRect.x;
  const y = baseRect.y + dy;
  const w = baseRect.width;
  const h = baseRect.height;
  const r = METRICS.cardRadius;

  ctx.save();

  if (isActive) {
    ctx.shadowColor = palette.bar;
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;
    ctx.globalAlpha = 0.12;
    pathSegmentShape(ctx, x, y, w, h, r, isFirst, isLast);
    ctx.fillStyle = palette.bar;
    ctx.fill();
    ctx.restore();
    ctx.save();
  }

  pathSegmentShape(ctx, x, y, w, h, r, isFirst, isLast);
  ctx.fillStyle = isActive ? palette.act : palette.bg;
  ctx.fill();

  ctx.lineWidth = isActive ? 1.5 : 0.8;
  ctx.strokeStyle = isActive ? palette.bar : CARD_BORDER_COLOR;
  ctx.stroke();

  if (isFirst) {
    ctx.save();
    ctx.globalAlpha = isActive ? 1.0 : 0.5;
    pathLeftBar(ctx, x, y, h, r);
    ctx.fillStyle = palette.bar;
    ctx.fill();
    ctx.restore();
  }

  const narrow = w < NARROW_THRESHOLD;
  const symbolSize = narrow ? 15 : 22;
  const cx = x + w / 2;
  const cy = y + h / 2 - (showRomans && chord.roman ? 6 : 0);

  ctx.fillStyle = THEME.foreground;
  ctx.font = `700 ${symbolSize}px ${SERIF_STACK}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(chord.symbol, cx, cy);

  if (showRomans && chord.roman) {
    const romanSize = narrow ? 8 : 11;
    ctx.save();
    ctx.globalAlpha = isActive ? 0.85 : 0.4;
    ctx.fillStyle = palette.txt;
    ctx.font = `500 ${romanSize}px ${MONO_STACK}`;
    ctx.fillText(chord.roman, cx, cy + symbolSize * 0.7 + 4);
    ctx.restore();
  }

  ctx.restore();
}

function drawSegmentDividers(
  ctx: CanvasRenderingContext2D,
  card: ProgressionCardLayout,
): void {
  if (card.chords.length <= 1) return;
  ctx.save();
  ctx.setLineDash([2, 2]);
  ctx.strokeStyle = SEGMENT_DASH_COLOR;
  ctx.lineWidth = 1;
  for (let i = 1; i < card.chords.length; i++) {
    const chord = card.chords[i]!;
    const x = chord.rect.x;
    ctx.beginPath();
    ctx.moveTo(x, chord.rect.y + 6);
    ctx.lineTo(x, chord.rect.y + chord.rect.height - 6);
    ctx.stroke();
  }
  ctx.restore();
}

function pathSegmentShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  roundLeft: boolean,
  roundRight: boolean,
): void {
  const rl = roundLeft ? r : 0;
  const rr = roundRight ? r : 0;
  ctx.beginPath();
  ctx.moveTo(x + rl, y);
  ctx.lineTo(x + w - rr, y);
  if (rr > 0) ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  if (rr > 0) ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rl, y + h);
  if (rl > 0) ctx.quadraticCurveTo(x, y + h, x, y + h - rl);
  ctx.lineTo(x, y + rl);
  if (rl > 0) ctx.quadraticCurveTo(x, y, x + rl, y);
  ctx.closePath();
}

function pathLeftBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  h: number,
  r: number,
): void {
  const w = METRICS.cardColorBarWidth;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawFlat(
  projector: Projector,
  layout: ProgressionLayout,
  showRomans: boolean,
): void {
  for (const card of layout.cards) {
    projector.drawRect(
      card.rect,
      THEME.cardBackground,
      THEME.cardBorder,
      METRICS.stroke,
      METRICS.cardRadius,
    );

    for (const chord of card.chords) {
      if (chord.rect.width < card.rect.width - 0.01) {
        projector.drawRect(chord.rect, undefined, THEME.grid, METRICS.stroke);
      }

      projector.drawText(
        chord.symbol,
        { x: chord.rect.x + chord.rect.width / 2, y: chord.rect.y + chord.rect.height / 2 },
        {
          font: FONT.ui,
          fontSize: 22,
          fontWeight: 'bold',
          fill: THEME.foreground,
          align: 'center',
          baseline: 'middle',
        },
      );

      if (showRomans && chord.roman) {
        projector.drawText(
          chord.roman,
          { x: chord.rect.x + chord.rect.width / 2, y: chord.rect.y + 16 },
          {
            font: FONT.mono,
            fontSize: 12,
            fill: THEME.muted,
            align: 'center',
            baseline: 'middle',
          },
        );
      }
    }
  }
}
