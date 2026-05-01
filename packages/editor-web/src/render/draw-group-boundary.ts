import type { Projector } from '@oon/shared';
import { CanvasProjector } from '@oon/projector-web';
import {
  BEAT_GROUP_BOUNDARY_COLOR,
  BEAT_GROUP_BOUNDARY_DASH,
  BEAT_GROUP_BOUNDARY_LINE_WIDTH,
} from '../constants.js';
import type { BeatSlotRect } from '../geometry/beat-overlay.js';

// 빈 영역의 음악적 메인박 그룹 경계를 점선 vertical line으로 표시한다.
// 음표가 채워진 마디는 beam grouping pass가 이미 그룹을 시각화하므로
// 여기서는 빈 슬롯(BeatSlotRect)에 한해서만 그린다.
//
// 슬롯 메타 가드:
// - groupIndex > 0  → 첫 그룹(0번)의 좌측은 마디 시작이라 별도 점선 불필요
// - isGroupStart    → 부분 슬롯(분수 beatIndex)은 그룹 경계가 아니므로 제외
export function drawGroupBoundaries(
  projector: Projector,
  slots: readonly BeatSlotRect[],
): void {
  for (const slot of slots) {
    if (slot.groupIndex <= 0) continue;
    if (!slot.isGroupStart) continue;
    drawDashedVLine(projector, slot.x, slot.y, slot.y + slot.height);
  }
}

function drawDashedVLine(projector: Projector, x: number, y1: number, y2: number): void {
  if (projector instanceof CanvasProjector) {
    projector.withCanvas2D((ctx) => {
      ctx.save();
      ctx.setLineDash([...BEAT_GROUP_BOUNDARY_DASH]);
      ctx.strokeStyle = BEAT_GROUP_BOUNDARY_COLOR;
      ctx.lineWidth = BEAT_GROUP_BOUNDARY_LINE_WIDTH;
      ctx.beginPath();
      ctx.moveTo(x, y1);
      ctx.lineTo(x, y2);
      ctx.stroke();
      ctx.restore();
    });
    return;
  }
  // 비-Canvas 백엔드 폴백: 점선 미지원이라 단색 vertical line으로 대체.
  projector.drawLine(
    { x, y: y1 },
    { x, y: y2 },
    BEAT_GROUP_BOUNDARY_COLOR,
    BEAT_GROUP_BOUNDARY_LINE_WIDTH,
  );
}
