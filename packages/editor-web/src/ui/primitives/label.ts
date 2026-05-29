// 일반 텍스트 라벨. 시스템 폰트 기준. measure는 fontSize 기반 근사
// (정확한 폭은 projector.measureText로 layout 시점에 검증 가능하지만, 본 컨트롤러는 짧은 라벨 전용).

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

export interface LabelProps {
  text: string;
  fontSize: number;
  fill: Color;
  fontFamily?: string;
  /** 셀 안 가로 정렬. 기본 center. */
  align?: 'left' | 'center' | 'right';
  /** 셀 안 세로 정렬. 기본 middle. */
  baseline?: 'top' | 'middle' | 'bottom';
  width?: number;
  height?: number;
}

export class Label implements Widget {
  private rect: Rect = { x: 0, y: 0, width: 0, height: 0 };

  constructor(private readonly props: LabelProps) {}

  measure(c: Constraints): Size {
    // 평균 글자 폭 ≈ fontSize * 0.6 가정.
    const w = this.props.width ?? this.props.text.length * this.props.fontSize * 0.6;
    const h = this.props.height ?? this.props.fontSize * 1.2;
    return clampSize(w, h, c);
  }

  layout(rect: Rect): void {
    this.rect = rect;
  }

  paint(projector: Projector): void {
    const { text, fontSize, fill } = this.props;
    const align = this.props.align ?? 'center';
    const baseline = this.props.baseline ?? 'middle';
    const cx = align === 'left'
      ? this.rect.x
      : align === 'right'
        ? this.rect.x + this.rect.width
        : this.rect.x + this.rect.width / 2;
    const cy = baseline === 'top'
      ? this.rect.y
      : baseline === 'bottom'
        ? this.rect.y + this.rect.height
        : this.rect.y + this.rect.height / 2;
    projector.drawText(
      text,
      { x: cx, y: cy },
      {
        font: this.props.fontFamily ?? 'system-ui',
        fontSize,
        fill,
        align,
        baseline,
      },
    );
  }

  hitTest(point: Point): string | null {
    if (!pointInRect(this.rect, point)) return null;
    return null;
  }
}
