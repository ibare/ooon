// 클릭 가능한 영역. Panel(배경) + 자식 콘텐츠 + hit token 등록.
// hover/active 상태는 외부에서 props로 주입(외부 상태 모델 — store/reducer가 결정).

import type { Color, Projector } from '@ooon/shared';
import {
  clampSize,
  pointInRect,
  type Constraints,
  type Point,
  type Rect,
  type Size,
  type Widget,
} from '../widget.js';

export interface ButtonProps {
  /** dispatch가 분기할 식별자. paint 시 projector.registerHitArea(token, rect)로 등록. */
  token: string;
  child: Widget;
  /** 평소 배경색. */
  fill?: Color;
  /** hover 상태 배경색. props.hovered가 true일 때 fill 대신 사용. */
  hoveredFill?: Color;
  /** 현재 hover 중인지 — 외부 reducer가 hit-test 결과로 토글. */
  hovered?: boolean;
  stroke?: Color;
  strokeWidth?: number;
  borderRadius?: number;
  /** 마우스 cursor 힌트. 기본 'pointer'. */
  cursor?: string;
  /** 자기 cell 폭/높이. 미지정 시 자식 크기. */
  width?: number;
  height?: number;
}

export class Button implements Widget {
  private rect: Rect = { x: 0, y: 0, width: 0, height: 0 };
  private childSize: Size = { width: 0, height: 0 };

  constructor(private readonly props: ButtonProps) {}

  measure(c: Constraints): Size {
    const fixedW = this.props.width;
    const fixedH = this.props.height;
    const childC: Constraints = {
      minWidth: fixedW ?? 0,
      maxWidth: fixedW ?? c.maxWidth,
      minHeight: fixedH ?? 0,
      maxHeight: fixedH ?? c.maxHeight,
    };
    this.childSize = this.props.child.measure(childC);
    const w = fixedW ?? this.childSize.width;
    const h = fixedH ?? this.childSize.height;
    return clampSize(w, h, c);
  }

  layout(rect: Rect): void {
    this.rect = rect;
    this.props.child.layout(rect);
  }

  paint(projector: Projector): void {
    const fill = this.props.hovered ? (this.props.hoveredFill ?? this.props.fill) : this.props.fill;
    projector.drawRect(
      this.rect,
      fill,
      this.props.stroke,
      this.props.strokeWidth ?? (this.props.stroke ? 1 : 0),
      this.props.borderRadius ?? 0,
    );
    this.props.child.paint(projector);
    projector.registerHitArea(this.props.token, this.rect, this.props.cursor ?? 'pointer');
  }

  hitTest(point: Point): string | null {
    if (!pointInRect(this.rect, point)) return null;
    return this.props.token;
  }
}
