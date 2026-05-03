// 자식을 고정 크기로 강제. 자식이 없으면 그 크기의 빈 공간(spacer)으로 동작.

import type { Projector } from '@oon/shared';
import {
  clampSize,
  pointInRect,
  type Constraints,
  type Point,
  type Rect,
  type Size,
  type Widget,
} from '../widget.js';

export interface SizedBoxProps {
  width: number;
  height: number;
  child?: Widget;
}

export class SizedBox implements Widget {
  private rect: Rect = { x: 0, y: 0, width: 0, height: 0 };

  constructor(private readonly props: SizedBoxProps) {}

  measure(c: Constraints): Size {
    if (this.props.child) {
      this.props.child.measure({
        minWidth: this.props.width,
        maxWidth: this.props.width,
        minHeight: this.props.height,
        maxHeight: this.props.height,
      });
    }
    return clampSize(this.props.width, this.props.height, c);
  }

  layout(rect: Rect): void {
    this.rect = { x: rect.x, y: rect.y, width: this.props.width, height: this.props.height };
    if (this.props.child) {
      this.props.child.layout(this.rect);
    }
  }

  paint(projector: Projector): void {
    if (this.props.child) this.props.child.paint(projector);
  }

  hitTest(point: Point): string | null {
    if (!pointInRect(this.rect, point)) return null;
    if (this.props.child) return this.props.child.hitTest(point);
    return null;
  }
}
