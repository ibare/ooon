import type { Projector } from '@ooon/shared';
import type { NoteNode } from '@ooon/core';
import { FONT, THEME } from '../theme.js';

export interface NoteRenderOptions {
  originX?: number;
  originY?: number;
}

export function renderNote(
  projector: Projector,
  node: NoteNode,
  opts: NoteRenderOptions = {},
): void {
  const ox = opts.originX ?? 0;
  const oy = opts.originY ?? 0;
  projector.save();
  projector.translate(ox, oy);
  projector.drawText(
    node.pitch,
    { x: 0, y: 0 },
    { font: FONT.ui, fontSize: 18, fontWeight: 'bold', fill: THEME.foreground, baseline: 'top' },
  );
  projector.drawText(
    `MIDI ${node.midiNumber} · ${node.frequency.toFixed(2)}Hz`,
    { x: 0, y: 22 },
    { font: FONT.mono, fontSize: 11, fill: THEME.muted, baseline: 'top' },
  );
  projector.restore();
}
