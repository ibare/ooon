import type { Projector } from '@ooon/shared';
import { PLUCK_ZONE_HIGHLIGHT_STROKE, PLUCK_ZONE_HOVER_FILL } from '../constants.js';
import type { PluckZoneRect } from '../geometry/pluck-zone.js';

export interface DrawPluckOptions {
  hovered?: PluckZoneRect | null;
  /** hover 위치에서 가장 가까운 line/space에 스냅된 y. 미지정 시 강조 안 함. */
  hoverSnappedY?: number | null;
  /** 스냅된 y에 그려질 ledger line 너비(보통 zone 폭의 1.4배). */
  highlightWidthOverride?: number;
}

export function drawPluckZones(
  projector: Projector,
  zones: readonly PluckZoneRect[],
  opts: DrawPluckOptions = {},
): void {
  for (const zone of zones) {
    if (opts.hovered && opts.hovered.systemIndex === zone.systemIndex) {
      projector.drawRect(
        { x: zone.x, y: zone.y, width: zone.width, height: zone.height },
        PLUCK_ZONE_HOVER_FILL,
      );
    }
  }
  if (opts.hovered && opts.hoverSnappedY !== null && opts.hoverSnappedY !== undefined) {
    const z = opts.hovered;
    const w = opts.highlightWidthOverride ?? z.width * 1.4;
    projector.drawLine(
      { x: z.x - w * 0.2, y: opts.hoverSnappedY },
      { x: z.x + w * 0.8, y: opts.hoverSnappedY },
      PLUCK_ZONE_HIGHLIGHT_STROKE,
      1.5,
    );
  }
}
