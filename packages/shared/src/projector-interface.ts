import type { Color, Point, Rect, Size, TextOptions } from './types.js';

/**
 * 렌더링 백엔드(웹 캔버스, SVG, 네이티브 등) 공통 추상화.
 *
 * 좌표계는 두 층으로 분리된다.
 * - **콘텐츠 좌표(layout 단위)**: 모든 draw* 메서드의 입력. 모든 백엔드에서 동일.
 * - **디스플레이 좌표(픽셀)**: 사용자가 보는 실제 출력. 백엔드가 contentScale × dpr로 매핑.
 *
 * `resize`로 두 좌표계 사이의 매핑을 한 번에 정의한다. 호출 측은 콘텐츠 좌표만 알면 되고,
 * 좁은 컨테이너에서는 백엔드가 자체적으로 축소(contentScale<1)하여 콘텐츠가 잘리지 않도록 한다.
 *
 * **strokeWidth 의미론**: 모든 stroke 인자(`drawRect`/`drawLine`/`drawPath` 등)는
 * **콘텐츠 단위가 아닌 "디스플레이 픽셀에 비례하는 단위"** 로 해석된다.
 * 즉 `contentScale`이 0.5라도 1px stroke은 화면에서 1 디바이스-px × dpr 두께를 유지한다.
 * 백엔드는 내부에서 `lineWidth = strokeWidth / contentScale`(또는 동등한 처리)로 보정해야 한다.
 * 이는 축소 시 1px 라인이 사라지는 현상을 방지하기 위함이며, SVG는 `vector-effect: non-scaling-stroke`,
 * 네이티브는 layer.contentsScale 보정 등으로 동일 의미를 구현한다.
 */
export interface Projector {
  /**
   * 출력 크기와 콘텐츠 매핑을 갱신한다.
   *
   * @param width  콘텐츠 좌표계 기준 폭. layout이 그려야 할 폭이다.
   * @param height 콘텐츠 좌표계 기준 높이.
   * @param opts.contentScale       콘텐츠→디스플레이 매핑 비율. 1이면 1콘텐츠px=1디스플레이px,
   *                                0.5면 콘텐츠 폭의 절반이 화면에 표시된다. 기본 1.
   * @param opts.devicePixelRatio   고해상도 보정. 미지정 시 환경 기본값(window.devicePixelRatio).
   *
   * 호출 후 `getSize()`는 콘텐츠 단위로 (width, height)를 반환한다.
   * 디스플레이 픽셀 크기는 `width × contentScale × dpr`이며 이는 백엔드 내부 관심사다.
   */
  resize(
    width: number,
    height: number,
    opts?: { contentScale?: number; devicePixelRatio?: number },
  ): void;

  drawRect(
    rect: Rect,
    fill?: Color,
    stroke?: Color,
    strokeWidth?: number,
    borderRadius?: number,
  ): void;

  drawCircle(
    center: Point,
    radius: number,
    fill?: Color,
    stroke?: Color,
    strokeWidth?: number,
  ): void;

  drawEllipse(
    center: Point,
    rx: number,
    ry: number,
    fill?: Color,
    stroke?: Color,
    rotation?: number,
  ): void;

  drawLine(from: Point, to: Point, stroke: Color, strokeWidth: number): void;

  drawPath(d: string, fill?: Color, stroke?: Color, strokeWidth?: number): void;

  drawText(text: string, position: Point, options: TextOptions): void;

  measureText(text: string, options: TextOptions): Size;

  save(): void;
  restore(): void;

  translate(dx: number, dy: number): void;
  scale(sx: number, sy: number): void;

  clip(rect: Rect): void;

  getSize(): Size;
  clear(): void;

  registerHitArea(id: string, rect: Rect, cursor?: string): void;
  clearHitAreas(): void;
}
