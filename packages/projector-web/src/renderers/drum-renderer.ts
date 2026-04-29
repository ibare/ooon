import type { Projector } from '@oon/shared';
import type { DrumLayout } from '@oon/instrument-layouts';
import { FONT, METRICS, THEME } from '../theme.js';

export interface DrumRenderOptions {
  originX?: number;
  originY?: number;
  labelWidth?: number;
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

function activeFillFor(track: string): string {
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

  // 1) 그리드: 모든 셀을 비활성 배경 + 얇은 그리드 외곽선으로 빈틈없이 채운다.
  for (const cell of layout.cells) {
    const rect = { x: cell.x, y: cell.y, width: cell.width, height: cell.height };
    projector.drawRect(
      rect,
      THEME.drumCellInactive,
      THEME.grid,
      METRICS.stroke,
      METRICS.drumCellRadius,
    );
    projector.registerHitArea(
      `drum:${cell.track}:${cell.barIndex}:${cell.cellIndex}`,
      rect,
      'pointer',
    );
  }

  // 2) 활성 셀: 작은 인셋 + 라운드 코너로 그리드 위에 떠 있는 색 타일을 그린다.
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

  projector.restore();
}
