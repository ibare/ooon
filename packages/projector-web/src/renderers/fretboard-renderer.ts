import type { Projector } from '@oon/shared';
import type { FretboardLayout } from '@oon/instrument-layouts';
import { FONT, METRICS, THEME } from '../theme.js';

export interface FretboardRenderOptions {
  originX?: number;
  originY?: number;
  dotRadius?: number;
  showLabels?: boolean;
}

export function renderFretboard(
  projector: Projector,
  layout: FretboardLayout,
  opts: FretboardRenderOptions = {},
): void {
  const ox = opts.originX ?? 0;
  const oy = opts.originY ?? 0;
  const dotRadius = opts.dotRadius ?? 10;
  const showLabels = opts.showLabels ?? true;

  projector.save();
  projector.translate(ox, oy);

  for (const s of layout.strings) {
    const firstFret = layout.frets[0];
    const lastFret = layout.frets[layout.frets.length - 1];
    if (!firstFret || !lastFret) continue;
    projector.drawLine(
      { x: firstFret.x, y: s.y },
      { x: lastFret.x, y: s.y },
      THEME.foreground,
      METRICS.stroke,
    );
  }

  for (const f of layout.frets) {
    const firstString = layout.strings[0];
    const lastString = layout.strings[layout.strings.length - 1];
    if (!firstString || !lastString) continue;
    const isNut = layout.nutX !== undefined && Math.abs(layout.nutX - f.x) < 0.01;
    projector.drawLine(
      { x: f.x, y: firstString.y },
      { x: f.x, y: lastString.y },
      THEME.foreground,
      isNut ? 3 : METRICS.stroke,
    );
  }

  for (const dot of layout.dots) {
    const fill = dot.isRoot ? THEME.rootDot : THEME.scaleDot;
    projector.drawCircle({ x: dot.x, y: dot.y }, dotRadius, fill);
    if (showLabels) {
      projector.drawText(
        dot.note,
        { x: dot.x, y: dot.y },
        { font: FONT.ui, fontSize: 10, fontWeight: 'bold', fill: '#ffffff', align: 'center', baseline: 'middle' },
      );
    }
    projector.registerHitArea(
      `fret:${dot.string}:${dot.fret}`,
      { x: dot.x - dotRadius, y: dot.y - dotRadius, width: dotRadius * 2, height: dotRadius * 2 },
      'pointer',
    );
  }

  for (const label of layout.fretLabels) {
    projector.drawText(
      String(label.fret),
      { x: label.x, y: label.y },
      { font: FONT.ui, fontSize: 10, fill: THEME.muted, align: 'center', baseline: 'bottom' },
    );
  }

  projector.restore();
}
