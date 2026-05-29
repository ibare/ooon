// 둥근 사각형 배경 + 테두리. 자식이 있으면 같은 영역에 겹쳐 그림.
// 자기 크기는 자식에 맞추거나 제약 최대치 — Stack/Padding과 조합해서 사용.

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

export interface PanelProps {
  fill?: Color;
  stroke?: Color;
  strokeWidth?: number;
  borderRadius?: number;
  /** child가 있으면 child 크기에 맞추고, 없으면 minWidth/minHeight 또는 제약 최대치를 사용. */
  child?: Widget;
  minWidth?: number;
  minHeight?: number;
}

export class Panel implements Widget {
  private rect: Rect = { x: 0, y: 0, width: 0, height: 0 };
  private childSize: Size | null = null;

  constructor(private readonly props: PanelProps) {}

  measure(c: Constraints): Size {
    if (this.props.child) {
      const s = this.props.child.measure(c);
      this.childSize = s;
      return clampSize(s.width, s.height, c);
    }
    this.childSize = null;
    const w = this.props.minWidth ?? c.minWidth;
    const h = this.props.minHeight ?? c.minHeight;
    return clampSize(w, h, c);
  }

  layout(rect: Rect): void {
    this.rect = rect;
    if (this.props.child) {
      this.props.child.layout(rect);
    }
  }

  paint(projector: Projector): void {
    projector.drawRect(
      this.rect,
      this.props.fill,
      this.props.stroke,
      this.props.strokeWidth ?? (this.props.stroke ? 1 : 0),
      this.props.borderRadius ?? 0,
    );
    if (this.props.child) this.props.child.paint(projector);
  }

  hitTest(point: Point): string | null {
    if (!pointInRect(this.rect, point)) return null;
    if (this.props.child) return this.props.child.hitTest(point);
    return null;
  }
}
