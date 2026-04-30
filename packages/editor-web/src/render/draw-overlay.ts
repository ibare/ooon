import type { Projector } from '@oon/shared';
import {
  BEAT_OVERLAY_BLINK_FILL,
  BEAT_OVERLAY_FILL,
  BEAT_OVERLAY_HOVER_FILL,
  BEAT_OVERLAY_STROKE,
} from '../constants.js';
import type { BeatSlotRect } from '../geometry/beat-overlay.js';

export interface DrawOverlayOptions {
  hovered?: BeatSlotRect | null;
  /** "박자 느끼기" 트리거 시 강조할 슬롯의 글로벌 인덱스. */
  blinkSlot?: BeatSlotRect | null;
}

// 빈 마디 박자 슬롯을 캔버스에 직접 그린다(반투명 사각형 + 1px 테두리).
export function drawBeatOverlay(
  projector: Projector,
  slots: readonly BeatSlotRect[],
  opts: DrawOverlayOptions = {},
): void {
  for (const slot of slots) {
    const fill = pickFill(slot, opts);
    projector.drawRect(
      { x: slot.x, y: slot.y, width: slot.width, height: slot.height },
      fill,
      BEAT_OVERLAY_STROKE,
      1,
      4,
    );
  }
}

function pickFill(slot: BeatSlotRect, opts: DrawOverlayOptions): string {
  if (sameSlot(opts.blinkSlot ?? null, slot)) return BEAT_OVERLAY_BLINK_FILL;
  if (sameSlot(opts.hovered ?? null, slot)) return BEAT_OVERLAY_HOVER_FILL;
  return BEAT_OVERLAY_FILL;
}

function sameSlot(a: BeatSlotRect | null, b: BeatSlotRect): boolean {
  if (!a) return false;
  return a.barIndex === b.barIndex && a.beatIndex === b.beatIndex;
}
