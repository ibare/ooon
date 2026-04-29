import type { Projector } from '@oon/shared';
import type { ScaleNode } from '@oon/core';
import { pitchToMidi } from '@oon/core';
import { calculateKeyboardLayout } from '@oon/instrument-layouts';
import { FONT, THEME } from '../theme.js';
import { renderKeyboard } from './keyboard-renderer.js';

export interface ScaleRenderOptions {
  originX?: number;
  originY?: number;
  showLabels?: boolean;
}

export function renderScale(
  projector: Projector,
  node: ScaleNode,
  opts: ScaleRenderOptions = {},
): void {
  const ox = opts.originX ?? 0;
  const oy = opts.originY ?? 0;
  const showLabels = opts.showLabels ?? false;

  const highlighted = new Set<number>();
  for (const p of node.notes) {
    try {
      highlighted.add(pitchToMidi(p.includes('/') ? p.split('/')[0] ?? p : p));
    } catch {
      // skip
    }
  }

  const layout = calculateKeyboardLayout({ highlighted, showLabels });

  projector.save();
  projector.translate(ox, oy);
  projector.drawText(
    `${node.root} ${node.scaleType}`,
    { x: 0, y: 0 },
    { font: FONT.ui, fontSize: 16, fontWeight: 'bold', fill: THEME.foreground, baseline: 'top' },
  );
  projector.restore();

  renderKeyboard(projector, layout, { originX: ox, originY: oy + 28, showLabels });
}
