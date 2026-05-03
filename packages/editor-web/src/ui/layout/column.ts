// 자식 위젯을 세로로 배치. gap만큼 사이 여백, align으로 가로 정렬.
// 자기 폭은 자식 최대 폭, 높이는 자식 합 + gap.

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

export interface ColumnProps {
  gap?: number;
  align?: CrossAxisAlign;
  children: Widget[];
}

export class Column implements Widget {
  private rect: Rect = { x: 0, y: 0, width: 0, height: 0 };
  private childSizes: Size[] = [];

  constructor(private readonly props: ColumnProps) {}

  measure(c: Constraints): Size {
    const gap = this.props.gap ?? 0;
    let totalH = 0;
    let maxW = 0;
    this.childSizes = [];
    const children = this.props.children;
    for (let i = 0; i < children.length; i += 1) {
      const childC: Constraints = {
        minWidth: 0,
        maxWidth: c.maxWidth,
        minHeight: 0,
        maxHeight: Number.POSITIVE_INFINITY,
      };
      const s = children[i]!.measure(childC);
      this.childSizes.push(s);
      totalH += s.height;
      if (s.width > maxW) maxW = s.width;
    }
    if (children.length > 1) totalH += gap * (children.length - 1);
    return clampSize(maxW, totalH, c);
  }

  layout(rect: Rect): void {
    this.rect = rect;
    const gap = this.props.gap ?? 0;
    const align = this.props.align ?? 'start';
    let cy = rect.y;
    const children = this.props.children;
    for (let i = 0; i < children.length; i += 1) {
      const s = this.childSizes[i]!;
      const w = align === 'stretch' ? rect.width : s.width;
      let cx = rect.x;
      if (align === 'center') cx = rect.x + (rect.width - s.width) / 2;
      else if (align === 'end') cx = rect.x + rect.width - s.width;
      children[i]!.layout({ x: cx, y: cy, width: w, height: s.height });
      cy += s.height + (i < children.length - 1 ? gap : 0);
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
