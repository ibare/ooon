import type { Projector } from '@oon/shared';
import type { SongLayout } from '@oon/core';
import { renderDrum } from './drum-renderer.js';
import { renderProgression } from './progression-renderer.js';
import { renderScore } from './score-renderer.js';

export interface SongRenderOptions {
  originX?: number;
  originY?: number;
  showNoteNames?: boolean;
}

export function renderSong(
  projector: Projector,
  layout: SongLayout,
  opts: SongRenderOptions = {},
): void {
  const ox = opts.originX ?? 0;
  const oy = opts.originY ?? 0;

  renderProgression(
    projector,
    {
      width: layout.width,
      height: layout.chordRow.height,
      cards: layout.chordRow.cards,
      cols: layout.chordRow.cards.length,
      rows: 1,
    },
    { originX: ox, originY: oy + layout.chordRow.y },
  );

  renderScore(projector, layout.scoreRow.score, {
    originX: ox,
    originY: oy + layout.scoreRow.y,
    ...(opts.showNoteNames !== undefined ? { showNoteNames: opts.showNoteNames } : {}),
  });

  if (layout.drumRow) {
    renderDrum(projector, layout.drumRow.drum, {
      originX: ox,
      originY: oy + layout.drumRow.y,
    });
  }
}
