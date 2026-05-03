// 자식을 일정 패딩으로 감싸 외곽 크기를 늘린다(자식 영역은 패딩만큼 안쪽으로 들여짐).

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

export interface EdgeInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export function allInset(value: number): EdgeInsets {
  return { top: value, right: value, bottom: value, left: value };
}

export function symmetricInset(vertical: number, horizontal: number): EdgeInsets {
  return { top: vertical, right: horizontal, bottom: vertical, left: horizontal };
}

export interface PaddingProps {
  insets: EdgeInsets;
  child: Widget;
}

export class Padding implements Widget {
  private rect: Rect = { x: 0, y: 0, width: 0, height: 0 };
  private childSize: Size = { width: 0, height: 0 };

  constructor(private readonly props: PaddingProps) {}

  measure(c: Constraints): Size {
    const { insets, child } = this.props;
    const horizPad = insets.left + insets.right;
    const vertPad = insets.top + insets.bottom;
    const childC: Constraints = {
      minWidth: 0,
      maxWidth: Math.max(0, c.maxWidth - horizPad),
      minHeight: 0,
      maxHeight: Math.max(0, c.maxHeight - vertPad),
    };
    const s = child.measure(childC);
    this.childSize = s;
    return clampSize(s.width + horizPad, s.height + vertPad, c);
  }

  layout(rect: Rect): void {
    this.rect = rect;
    const { insets, child } = this.props;
    child.layout({
      x: rect.x + insets.left,
      y: rect.y + insets.top,
      width: this.childSize.width,
      height: this.childSize.height,
    });
  }

  paint(projector: Projector): void {
    this.props.child.paint(projector);
  }

  hitTest(point: Point): string | null {
    if (!pointInRect(this.rect, point)) return null;
    return this.props.child.hitTest(point);
  }
}
