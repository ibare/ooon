// 카테고리 토글 바 — 세그먼티드 컨트롤(iOS/macOS 스타일).
// 외곽 트랙(둥근 캡슐) 안에 셀들이 gap 없이 붙어 있고, 활성 셀만 안쪽으로 inset된 강조 배경 +
// 작은 radius로 떠오르듯 표시된다. 비활성 셀은 트랙 색이 그대로 비치고, hover 시에만 옅게.
// dispatch는 외부에서 token으로 분기 — token = `${tokenPrefix}:${itemId}`.
//
// 위젯 자체는 toggle 동작을 수행하지 않는다(active set은 외부 store가 보유). 시각만 반영.

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

export type ToggleMode = 'multi' | 'single';

export interface ToggleGroupItem {
  id: string;
  child: Widget;
}

export interface ToggleGroupProps {
  /** dispatch 분기용 prefix. 결과 token = `${tokenPrefix}:${item.id}`. */
  tokenPrefix: string;
  mode: ToggleMode;
  items: ToggleGroupItem[];
  /** 현재 활성된 id 집합. single 모드에서는 size 0 또는 1. */
  active: ReadonlySet<string>;
  /** 현재 hover 중인 id(있다면). */
  hoveredId?: string | null;
  itemWidth: number;
  itemHeight: number;
  /** 트랙 외곽 fill — 셀들 뒤에 깔리는 캡슐 배경. */
  trackFill?: Color;
  /** 트랙 외곽 stroke — 옅은 테두리로 깊이감. */
  trackStroke?: Color;
  /** 트랙 안쪽 padding — 활성 셀의 inset 두께(상하/좌우 동일). */
  trackPadding?: number;
  /** 트랙 외곽 radius. */
  trackRadius?: number;
  /** 활성 셀 inset 사각형 fill. */
  activeFill?: Color;
  /** 활성 셀 inset radius — 트랙 radius보다 작게 두면 동심. */
  activeInsetRadius?: number;
  /** hover 셀(비활성에만 적용) fill. 활성+hover는 active 색 유지. */
  hoveredFill?: Color;
}

export class ToggleGroup implements Widget {
  private rect: Rect = { x: 0, y: 0, width: 0, height: 0 };
  private itemRects: Rect[] = [];

  constructor(private readonly props: ToggleGroupProps) {}

  measure(c: Constraints): Size {
    const pad = this.props.trackPadding ?? 0;
    const n = this.props.items.length;
    const w = this.props.itemWidth * n + pad * 2;
    const h = this.props.itemHeight + pad * 2;
    for (const item of this.props.items) {
      item.child.measure({
        minWidth: this.props.itemWidth,
        maxWidth: this.props.itemWidth,
        minHeight: this.props.itemHeight,
        maxHeight: this.props.itemHeight,
      });
    }
    return clampSize(w, h, c);
  }

  layout(rect: Rect): void {
    this.rect = rect;
    const pad = this.props.trackPadding ?? 0;
    this.itemRects = [];
    let cx = rect.x + pad;
    const cy = rect.y + pad;
    for (const item of this.props.items) {
      const itemRect: Rect = {
        x: cx,
        y: cy,
        width: this.props.itemWidth,
        height: this.props.itemHeight,
      };
      this.itemRects.push(itemRect);
      item.child.layout(itemRect);
      cx += this.props.itemWidth;
    }
  }

  paint(projector: Projector): void {
    // 트랙 외곽 — 활성 inset 강조의 컨트라스트 기준이 되므로 먼저.
    if (this.props.trackFill || this.props.trackStroke) {
      projector.drawRect(
        this.rect,
        this.props.trackFill,
        this.props.trackStroke,
        this.props.trackStroke ? 1 : 0,
        this.props.trackRadius ?? 0,
      );
    }

    for (let i = 0; i < this.props.items.length; i += 1) {
      const item = this.props.items[i]!;
      const r = this.itemRects[i]!;
      const isActive = this.props.active.has(item.id);
      const isHovered = this.props.hoveredId === item.id;

      if (isActive && this.props.activeFill) {
        projector.drawRect(
          r,
          this.props.activeFill,
          undefined,
          0,
          this.props.activeInsetRadius ?? 0,
        );
      } else if (isHovered && this.props.hoveredFill) {
        projector.drawRect(
          r,
          this.props.hoveredFill,
          undefined,
          0,
          this.props.activeInsetRadius ?? 0,
        );
      }

      item.child.paint(projector);
      projector.registerHitArea(`${this.props.tokenPrefix}:${item.id}`, r, 'pointer');
    }
  }

  hitTest(point: Point): string | null {
    if (!pointInRect(this.rect, point)) return null;
    for (let i = 0; i < this.itemRects.length; i += 1) {
      if (pointInRect(this.itemRects[i]!, point)) {
        return `${this.props.tokenPrefix}:${this.props.items[i]!.id}`;
      }
    }
    return null;
  }
}

/**
 * ToggleGroup의 토큰 형식("prefix:id")에서 itemId를 파싱.
 * 외부 dispatch가 사용. prefix 일치 검사도 함께 수행.
 */
export function parseToggleToken(token: string, prefix: string): string | null {
  if (!token.startsWith(`${prefix}:`)) return null;
  return token.slice(prefix.length + 1);
}

/**
 * 토글 동작 reducer. mode에 따라 active set을 갱신해 새 set을 반환.
 * 위젯은 호출하지 않는다 — 외부 reducer가 dispatch에서 호출.
 */
export function applyToggle(
  active: ReadonlySet<string>,
  itemId: string,
  mode: ToggleMode,
): ReadonlySet<string> {
  if (mode === 'single') {
    if (active.has(itemId) && active.size === 1) return active; // 마지막 항목 해제 방지
    return new Set([itemId]);
  }
  const next = new Set(active);
  if (next.has(itemId)) next.delete(itemId);
  else next.add(itemId);
  return next;
}
