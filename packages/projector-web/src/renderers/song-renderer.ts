import type { Projector } from '@oon/shared';
import type { SongLayout } from '@oon/composition';
import { renderDrum } from './drum-renderer.js';
import { renderKeyboard } from './keyboard-renderer.js';
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

  // 1) 키보드: Song 최상단 1회
  renderKeyboard(projector, layout.keyboard.layout, {
    originX: ox,
    originY: oy + layout.keyboard.y,
    showLabels: true,
  });

  // 2) 시스템 순회: progression → score → drum
  for (const sys of layout.systems) {
    const sysOriginY = oy + sys.y;

    if (sys.progression) {
      renderProgression(
        projector,
        {
          width: 0,
          height: sys.progression.height,
          cards: sys.progression.cards,
        },
        { originX: ox, originY: sysOriginY + sys.progression.y },
      );
    }

    renderScore(projector, sys.score.layout, {
      originX: ox,
      originY: sysOriginY + sys.score.y,
      ...(opts.showNoteNames !== undefined ? { showNoteNames: opts.showNoteNames } : {}),
    });

    if (sys.drum) {
      renderDrum(projector, sys.drum.layout, {
        originX: ox,
        originY: sysOriginY + sys.drum.y,
      });
    }
  }
}
