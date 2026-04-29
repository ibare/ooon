import type { Projector } from '@oon/shared';
import type { ProgressionLayout } from '@oon/instrument-layouts';
import { FONT, METRICS, THEME } from '../theme.js';

export interface ProgressionRenderOptions {
  originX?: number;
  originY?: number;
  showRomans?: boolean;
}

export function renderProgression(
  projector: Projector,
  layout: ProgressionLayout,
  opts: ProgressionRenderOptions = {},
): void {
  const ox = opts.originX ?? 0;
  const oy = opts.originY ?? 0;
  const showRomans = opts.showRomans ?? true;

  projector.save();
  projector.translate(ox, oy);

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

      projector.registerHitArea(
        `chord:${card.barNumber}:${chord.symbol}`,
        chord.rect,
        'pointer',
      );
    }
  }

  projector.restore();
}
