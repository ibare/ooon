import type { Projector } from '@oon/shared';
import { getSongPlayhead, type SongLayout } from '@oon/composition';

export interface SongPlayheadOverlayOptions {
  originX?: number;
  originY?: number;
  color?: string;
  width?: number;
}

/**
 * song layout 위에 playhead vertical line을 chord/score/drum row마다 그린다.
 * beat는 곡 시작 기준 누적 박자(timeSignature 기준).
 */
export function drawSongPlayheadOverlay(
  projector: Projector,
  layout: SongLayout,
  beat: number,
  beatsPerBar: number,
  opts: SongPlayheadOverlayOptions = {},
): void {
  const ox = opts.originX ?? 0;
  const oy = opts.originY ?? 0;
  const color = opts.color ?? '#ef4444';
  const lineWidth = opts.width ?? 2;
  const pos = getSongPlayhead(layout, beat, beatsPerBar);

  drawVertical(projector, ox + pos.chord.x, oy + pos.chord.y, oy + pos.chord.y + pos.chord.height, color, lineWidth);

  if (pos.score) {
    drawVertical(
      projector,
      ox + pos.score.x,
      oy + pos.score.y,
      oy + pos.score.y + pos.score.height,
      color,
      lineWidth,
    );
  }

  if (pos.drum) {
    drawVertical(
      projector,
      ox + pos.drum.x,
      oy + pos.drum.y,
      oy + pos.drum.y + pos.drum.height,
      color,
      lineWidth,
    );
  }
}

function drawVertical(
  projector: Projector,
  x: number,
  y1: number,
  y2: number,
  color: string,
  width: number,
): void {
  projector.drawLine({ x, y: y1 }, { x, y: y2 }, color, width);
}
