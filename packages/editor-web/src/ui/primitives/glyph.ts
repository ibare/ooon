// SMuFL 글리프 한 개를 자기 영역의 정렬 위치에 그린다.
// 폰트는 BRAVURA 사용. 측정은 fontSize 기반 근사 — 글리프 cell이 폰트 크기 정사각형이라고 가정.

import { BRAVURA_FONT_FAMILY } from '@ooon/core';
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

export type HorizontalAlign = 'left' | 'center' | 'right';
export type VerticalAlign = 'top' | 'middle' | 'bottom';

export interface GlyphProps {
  glyph: string;
  fontSize: number;
  fill: Color;
  /** 셀 안 가로 정렬. 기본 center. */
  align?: HorizontalAlign;
  /** 셀 안 세로 정렬. 기본 middle. */
  baseline?: VerticalAlign;
  /** 자기 cell 폭/높이 명시. 미지정 시 fontSize 정사각형. */
  width?: number;
  height?: number;
}

export class Glyph implements Widget {
  private rect: Rect = { x: 0, y: 0, width: 0, height: 0 };

  constructor(private readonly props: GlyphProps) {}

  measure(c: Constraints): Size {
    const w = this.props.width ?? this.props.fontSize;
    const h = this.props.height ?? this.props.fontSize;
    return clampSize(w, h, c);
  }

  layout(rect: Rect): void {
    this.rect = rect;
  }

  paint(projector: Projector): void {
    const { glyph, fontSize, fill } = this.props;
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
      glyph,
      { x: cx, y: cy },
      {
        font: `${BRAVURA_FONT_FAMILY}, system-ui`,
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
