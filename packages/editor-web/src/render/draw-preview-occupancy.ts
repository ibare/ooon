import type { Projector } from '@ooon/shared';
import { PREVIEW_OCCUPANCY_FILL } from '../constants.js';
import type { PreviewOccupancyRect } from '../geometry/preview-occupancy.js';

// picker hover 옵션의 점유 박자 영역을 핑크 반투명으로 채운다.
// 박자 슬롯과 같은 staff top~bottom 영역을 차지하며, 박자 오버레이 위에 겹쳐져 부드럽게 합쳐진다.
export function drawPreviewOccupancy(projector: Projector, rect: PreviewOccupancyRect): void {
  projector.drawRect(rect, PREVIEW_OCCUPANCY_FILL);
}
