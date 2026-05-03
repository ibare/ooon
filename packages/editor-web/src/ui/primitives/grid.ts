// 고정 cell 크기의 cols × rows 그리드. 자식은 row-major 순서로 셀에 채워짐.
// 자식보다 셀이 더 많은 경우 빈 셀은 emptyCellFill로 표시(시각용).
//
// hit는 자식 위젯에 위임 — Grid 자체는 token을 등록하지 않는다.
// Button을 자식으로 넣으면 셀별 클릭이 동작.

import type { Color, Projector } from '@oon/shared';
import {
  clampSize,
  pointInRect,
  type Constraints,
  type Point,
  type Rect,
  type Size,
  type Widget,
} from '../widget.js';

export interface GridProps {
  cols: number;
  /** 미지정 시 ceil(children.length / cols). */
  rows?: number;
  cellWidth: number;
  cellHeight: number;
  /** cell 사이 간격(가로/세로 동일). */
  gap?: number;
  children: Widget[];
  /** 자식이 채우지 않은 셀 배경. 미지정 시 빈 셀은 그리지 않음(투명). */
  emptyCellFill?: Color;
  /** 빈 셀 borderRadius. emptyCellFill과 함께 사용. */
  emptyCellRadius?: number;
}

export class Grid implements Widget {
  private rect: Rect = { x: 0, y: 0, width: 0, height: 0 };
  private cellRects: Rect[] = [];

  constructor(private readonly props: GridProps) {}

  private get rowCount(): number {
    return this.props.rows ?? Math.max(1, Math.ceil(this.props.children.length / this.props.cols));
  }

  measure(c: Constraints): Size {
    const gap = this.props.gap ?? 0;
    const w = this.props.cellWidth * this.props.cols + gap * Math.max(0, this.props.cols - 1);
    const h = this.props.cellHeight * this.rowCount + gap * Math.max(0, this.rowCount - 1);
    // 자식들에게 cell 크기 measure(layout 시에만 사용되지만 일관성 위해).
    for (const child of this.props.children) {
      child.measure({
        minWidth: this.props.cellWidth,
        maxWidth: this.props.cellWidth,
        minHeight: this.props.cellHeight,
        maxHeight: this.props.cellHeight,
      });
    }
    return clampSize(w, h, c);
  }

  layout(rect: Rect): void {
    this.rect = rect;
    const gap = this.props.gap ?? 0;
    const total = this.props.cols * this.rowCount;
    this.cellRects = [];
    for (let i = 0; i < total; i += 1) {
      const r = Math.floor(i / this.props.cols);
      const c = i % this.props.cols;
      const cellRect: Rect = {
        x: rect.x + c * (this.props.cellWidth + gap),
        y: rect.y + r * (this.props.cellHeight + gap),
        width: this.props.cellWidth,
        height: this.props.cellHeight,
      };
      this.cellRects.push(cellRect);
      const child = this.props.children[i];
      if (child) child.layout(cellRect);
    }
  }

  paint(projector: Projector): void {
    if (this.props.emptyCellFill) {
      for (let i = 0; i < this.cellRects.length; i += 1) {
        if (!this.props.children[i]) {
          projector.drawRect(
            this.cellRects[i]!,
            this.props.emptyCellFill,
            undefined,
            0,
            this.props.emptyCellRadius ?? 0,
          );
        }
      }
    }
    for (const child of this.props.children) child.paint(projector);
  }

  hitTest(point: Point): string | null {
    if (!pointInRect(this.rect, point)) return null;
    for (const child of this.props.children) {
      const h = child.hitTest(point);
      if (h !== null) return h;
    }
    return null;
  }
}
