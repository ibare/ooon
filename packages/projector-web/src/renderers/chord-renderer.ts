import type { Projector } from '@ooon/shared';
import type { ChordNode } from '@ooon/core';
import { pitchToMidi } from '@ooon/core';
import { calculateKeyboardLayout } from '@ooon/instrument-layouts';
import { FONT, THEME } from '../theme.js';
import { renderKeyboard } from './keyboard-renderer.js';

export interface ChordRenderOptions {
  originX?: number;
  originY?: number;
  showLabels?: boolean;
  width?: number;
}

export function renderChord(
  projector: Projector,
  node: ChordNode,
  opts: ChordRenderOptions = {},
): void {
  const ox = opts.originX ?? 0;
  const oy = opts.originY ?? 0;
  const showLabels = opts.showLabels ?? false;

  const highlighted = new Set<number>();
  for (const p of node.notes) {
    try {
      highlighted.add(pitchToMidi(p));
    } catch {
      // skip unparsable pitch
    }
  }

  const layout = calculateKeyboardLayout({ highlighted, showLabels });

  projector.save();
  projector.translate(ox, oy);
  projector.drawText(
    node.symbol,
    { x: 0, y: 0 },
    { font: FONT.ui, fontSize: 18, fontWeight: 'bold', fill: THEME.foreground, baseline: 'top' },
  );
  projector.restore();

  renderKeyboard(projector, layout, { originX: ox, originY: oy + 28, showLabels });
}
