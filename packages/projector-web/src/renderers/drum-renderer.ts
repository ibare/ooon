import type { Projector } from '@oon/shared';
import type { DrumLayout } from '@oon/instrument-layouts';
import { FONT, METRICS, THEME } from '../theme.js';

export interface DrumRenderOptions {
  originX?: number;
  originY?: number;
  labelWidth?: number;
}

export function renderDrum(
  projector: Projector,
  layout: DrumLayout,
  opts: DrumRenderOptions = {},
): void {
  const ox = opts.originX ?? 0;
  const oy = opts.originY ?? 0;

  projector.save();
  projector.translate(ox, oy);

  for (const track of layout.tracks) {
    projector.drawText(
      track.label,
      { x: 8, y: track.y + track.height / 2 },
      { font: FONT.ui, fontSize: 12, fill: THEME.muted, baseline: 'middle' },
    );
  }

  for (const cell of layout.cells) {
    const rect = { x: cell.x, y: cell.y, width: cell.width, height: cell.height };
    const fill = cell.active ? THEME.drumCellActive : THEME.drumCellInactive;
    projector.drawRect(rect, fill, THEME.grid, METRICS.stroke, METRICS.drumCellRadius);
    projector.registerHitArea(
      `drum:${cell.track}:${cell.barIndex}:${cell.cellIndex}`,
      rect,
      'pointer',
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
      THEME.barline,
      METRICS.barlineWidth,
    );
  }

  projector.restore();
}
