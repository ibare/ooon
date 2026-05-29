import type { Projector } from '@ooon/shared';
import type { NoteHitRect } from '../geometry/note-hit.js';

// 디버그 전용. Shift+S 누르고 있는 동안만 호출되어 음표 hit rect 영역을 시각화한다.
const DEBUG_HIT_FILL = 'rgba(220, 38, 38, 0.3)';

export function drawDebugNoteHits(
  projector: Projector,
  hits: readonly NoteHitRect[],
): void {
  for (const r of hits) {
    projector.drawRect(
      { x: r.x, y: r.y, width: r.width, height: r.height },
      DEBUG_HIT_FILL,
      undefined,
      0,
      0,
    );
  }
}
