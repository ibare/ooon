// 자식 위젯들을 같은 영역에 겹쳐 배치. 첫 자식이 가장 아래, 마지막이 가장 위.
// 패널 + 콘텐츠 같이 그릴 때 사용. hit는 위→아래 순으로 검사.

import type { Projector } from '@ooon/shared';
import {
  clampSize,
  pointInRect,
  type Constraints,
  type Point,
  type Rect,
  type Size,
  type Widget,
} from '../widget.js';

export interface StackProps {
  children: Widget[];
}

export class Stack implements Widget {
  private rect: Rect = { x: 0, y: 0, width: 0, height: 0 };
  private childSizes: Size[] = [];

  constructor(private readonly props: StackProps) {}

  measure(c: Constraints): Size {
    let maxW = 0;
    let maxH = 0;
    this.childSizes = [];
    for (const child of this.props.children) {
      const s = child.measure(c);
      this.childSizes.push(s);
      if (s.width > maxW) maxW = s.width;
      if (s.height > maxH) maxH = s.height;
    }
    return clampSize(maxW, maxH, c);
  }

  layout(rect: Rect): void {
    this.rect = rect;
    for (const child of this.props.children) {
      child.layout(rect);
    }
  }

  paint(projector: Projector): void {
    for (const c of this.props.children) c.paint(projector);
  }

  hitTest(point: Point): string | null {
    if (!pointInRect(this.rect, point)) return null;
    const children = this.props.children;
    for (let i = children.length - 1; i >= 0; i -= 1) {
      const h = children[i]!.hitTest(point);
      if (h !== null) return h;
    }
    return null;
  }
}
