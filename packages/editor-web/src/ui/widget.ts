// ─────────────────────────────────────────────────────────────────────────────
// canvas-ui 위젯 인터페이스.
//
// 모델: Flutter/Compose 계열의 measure → layout → paint 분리.
//   1) measure(constraints) → Size  : intrinsic 크기 산출(자식 measure 누적). 부수효과로
//                                     자식 사이즈 캐시. 부모는 이 값으로 자기 크기를 결정.
//   2) layout(rect)                  : 부모가 확정한 절대 영역으로 자기/자식 배치(rect 저장).
//   3) paint(projector)              : 트리 순회하며 그리기. hit token도 paint에서 함께 등록 가능.
//   4) hitTest(point) → string|null  : 좌표→hit token 라우팅. 자식 우선(상단이 우선).
//
// 위젯은 콜백을 들고 있지 않는다. hit은 token(문자열)으로만 발화한다.
// dispatch는 외부 reducer가 token으로 분기 → 상태 변경 → 트리 재빌드.
// 이유: 위젯이 stale closure를 잡지 않음, 단방향 데이터 흐름, 임의 store와 결합 가능.
// ─────────────────────────────────────────────────────────────────────────────

import type { Point, Projector, Rect, Size } from '@oon/shared';

export type { Point, Rect, Size };

export interface Constraints {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
}

export const UNCONSTRAINED: Constraints = {
  minWidth: 0,
  maxWidth: Number.POSITIVE_INFINITY,
  minHeight: 0,
  maxHeight: Number.POSITIVE_INFINITY,
};

export function tightWidth(width: number, c: Constraints): Constraints {
  return { minWidth: width, maxWidth: width, minHeight: c.minHeight, maxHeight: c.maxHeight };
}

export interface Widget {
  /** intrinsic 크기 산출. 부수효과로 자식 사이즈를 캐시할 수 있음. */
  measure(c: Constraints): Size;
  /** 부모가 확정한 절대 영역으로 자기·자식 배치. paint/hitTest 이전에 반드시 호출. */
  layout(rect: Rect): void;
  /** 트리 순회하며 그리기. paint 시 projector.registerHitArea를 같이 호출해도 무방. */
  paint(projector: Projector): void;
  /** 좌표가 어떤 hit token에 해당하는지. 자기 영역 밖이면 null. */
  hitTest(point: Point): string | null;
}

export function pointInRect(r: Rect, p: Point): boolean {
  return p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height;
}

export function clampSize(width: number, height: number, c: Constraints): Size {
  return {
    width: Math.min(c.maxWidth, Math.max(c.minWidth, width)),
    height: Math.min(c.maxHeight, Math.max(c.minHeight, height)),
  };
}
