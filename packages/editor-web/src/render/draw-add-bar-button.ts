import type { Projector } from '@oon/shared';
import {
  ADD_BAR_BUTTON_FILL,
  ADD_BAR_BUTTON_FILL_HOVER,
  ADD_BAR_BUTTON_GLYPH,
  ADD_BAR_BUTTON_GLYPH_LENGTH_RATIO,
  ADD_BAR_BUTTON_GLYPH_THICKNESS,
  ADD_BAR_BUTTON_STROKE,
  ADD_BAR_BUTTON_STROKE_HOVER,
} from '../constants.js';
import type { AddBarHitRect } from '../geometry/add-bar-hit.js';

// 마지막 마디 우측의 + 버튼을 그린다. hover 상태에 따라 채움/테두리 색이 진해진다.
// 글리프(+)는 두 개의 stroke 라인으로 그리며 길이는 radius * LENGTH_RATIO에서 양쪽으로 뻗는다.
export function drawAddBarButton(
  projector: Projector,
  hit: AddBarHitRect,
  options: { hovered: boolean },
): void {
  const fill = options.hovered ? ADD_BAR_BUTTON_FILL_HOVER : ADD_BAR_BUTTON_FILL;
  const stroke = options.hovered ? ADD_BAR_BUTTON_STROKE_HOVER : ADD_BAR_BUTTON_STROKE;

  projector.drawCircle({ x: hit.cx, y: hit.cy }, hit.radius, fill, stroke, 1.5);

  const half = hit.radius * ADD_BAR_BUTTON_GLYPH_LENGTH_RATIO;
  projector.drawLine(
    { x: hit.cx - half, y: hit.cy },
    { x: hit.cx + half, y: hit.cy },
    ADD_BAR_BUTTON_GLYPH,
    ADD_BAR_BUTTON_GLYPH_THICKNESS,
  );
  projector.drawLine(
    { x: hit.cx, y: hit.cy - half },
    { x: hit.cx, y: hit.cy + half },
    ADD_BAR_BUTTON_GLYPH,
    ADD_BAR_BUTTON_GLYPH_THICKNESS,
  );
}
