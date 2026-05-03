// 자식 위젯을 가로로 배치. gap만큼 사이 여백, align으로 세로 정렬.
// 자기 폭은 자식 합 + gap, 높이는 자식 최대 높이.

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

export type CrossAxisAlign = 'start' | 'center' | 'end' | 'stretch';

export interface RowProps {
  gap?: number;
  align?: CrossAxisAlign;
  children: Widget[];
}

export class Row implements Widget {
  private rect: Rect = { x: 0, y: 0, width: 0, height: 0 };
  private childSizes: Size[] = [];

  constructor(private readonly props: RowProps) {}

  measure(c: Constraints): Size {
    const gap = this.props.gap ?? 0;
    let totalW = 0;
    let maxH = 0;
    this.childSizes = [];
    const children = this.props.children;
    for (let i = 0; i < children.length; i += 1) {
      const childC: Constraints = {
        minWidth: 0,
        maxWidth: Number.POSITIVE_INFINITY,
        minHeight: 0,
        maxHeight: c.maxHeight,
      };
      const s = children[i]!.measure(childC);
      this.childSizes.push(s);
      totalW += s.width;
      if (s.height > maxH) maxH = s.height;
    }
    if (children.length > 1) totalW += gap * (children.length - 1);
    return clampSize(totalW, maxH, c);
  }

  layout(rect: Rect): void {
    this.rect = rect;
    const gap = this.props.gap ?? 0;
    const align = this.props.align ?? 'start';
    let cx = rect.x;
    const children = this.props.children;
    for (let i = 0; i < children.length; i += 1) {
      const s = this.childSizes[i]!;
      const h = align === 'stretch' ? rect.height : s.height;
      let cy = rect.y;
      if (align === 'center') cy = rect.y + (rect.height - s.height) / 2;
      else if (align === 'end') cy = rect.y + rect.height - s.height;
      children[i]!.layout({ x: cx, y: cy, width: s.width, height: h });
      cx += s.width + (i < children.length - 1 ? gap : 0);
    }
  }

  paint(projector: Projector): void {
    for (const c of this.props.children) c.paint(projector);
  }

  hitTest(point: Point): string | null {
    if (!pointInRect(this.rect, point)) return null;
    for (const c of this.props.children) {
      const h = c.hitTest(point);
      if (h !== null) return h;
    }
    return null;
  }
}
