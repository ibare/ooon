import type { HitArea, Point } from '@ooon/shared';

export function hitTest(areas: readonly HitArea[], point: Point): HitArea | undefined {
  for (let i = areas.length - 1; i >= 0; i--) {
    const a = areas[i];
    if (!a) continue;
    const r = a.rect;
    if (point.x >= r.x && point.x <= r.x + r.width && point.y >= r.y && point.y <= r.y + r.height) {
      return a;
    }
  }
  return undefined;
}
