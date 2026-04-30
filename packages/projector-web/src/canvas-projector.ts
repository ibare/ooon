import type { Color, HitArea, Point, Projector, Rect, Size, TextOptions } from '@oon/shared';

export interface CanvasProjectorOptions {
  devicePixelRatio?: number;
  defaultFont?: string;
  defaultFontSize?: number;
  defaultFill?: Color;
}

/**
 * Web Canvas 백엔드.
 *
 * 좌표계 계약은 `Projector` 인터페이스 docstring 참고. 본 구현이 보장하는 단단함:
 *
 * 1. **정수 디바이스 픽셀 정렬**: 캔버스 백버퍼는 항상 정수 픽셀. `resize`가 ceil로 정렬한 뒤
 *    실제 적용되는 contentScale을 역산하므로 콘텐츠는 백버퍼를 정확히 채운다.
 * 2. **단일 진실 변환행렬**: ctx 변환은 `setTransform(dpr × contentScale, …)` 한 번으로 결정.
 *    `clear()`와 `resize()`가 같은 매개변수로 행렬을 재설정하므로 누적·표류가 없다.
 * 3. **stroke 두께 보존**: 모든 stroke 메서드는 `lineWidth = strokeWidth / contentScale`로
 *    보정해, 콘텐츠가 축소되어도 화면상 라인 두께는 `strokeWidth × dpr` 픽셀로 유지된다.
 */
export class CanvasProjector implements Projector {
  readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private dpr: number;
  /** 실제 적용된 contentScale. 픽셀 정렬에 의해 요청값과 약간 다를 수 있다. */
  private contentScale = 1;
  /** 콘텐츠 좌표계 기준 폭/높이 — `getSize()`와 좌표 역변환의 진실. */
  private contentWidth = 0;
  private contentHeight = 0;
  private readonly defaultFont: string;
  private readonly defaultFontSize: number;
  private readonly defaultFill: Color;
  private hitAreas: HitArea[] = [];

  constructor(canvas: HTMLCanvasElement, opts: CanvasProjectorOptions = {}) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('CanvasProjector: 2D context not available');
    this.canvas = canvas;
    this.ctx = ctx;
    this.dpr =
      opts.devicePixelRatio ??
      (typeof window !== 'undefined' ? window.devicePixelRatio : 1) ??
      1;
    this.defaultFont = opts.defaultFont ?? 'system-ui, sans-serif';
    this.defaultFontSize = opts.defaultFontSize ?? 14;
    this.defaultFill = opts.defaultFill ?? '#111827';
    this.applyBaseTransform();
  }

  resize(
    width: number,
    height: number,
    opts: { contentScale?: number; devicePixelRatio?: number } = {},
  ): void {
    if (!(width > 0) || !(height > 0)) {
      throw new Error('CanvasProjector.resize: width/height must be > 0');
    }
    if (opts.devicePixelRatio !== undefined) {
      if (!(opts.devicePixelRatio > 0)) {
        throw new Error('CanvasProjector.resize: devicePixelRatio must be > 0');
      }
      this.dpr = opts.devicePixelRatio;
    }
    const desiredCS = opts.contentScale ?? 1;
    if (!(desiredCS > 0)) {
      throw new Error('CanvasProjector.resize: contentScale must be > 0');
    }

    // 백버퍼는 정수 디바이스 픽셀. floor로 컨테이너 초과 방지(스크롤바 절대 금지 규칙).
    // 최대 1 디바이스 픽셀 잘림 가능성은 시각적으로 거의 인지 불가하며, fit 보장이 우선.
    const backW = Math.max(1, Math.floor(width * desiredCS * this.dpr));
    const backH = Math.max(1, Math.floor(height * desiredCS * this.dpr));
    this.canvas.width = backW;
    this.canvas.height = backH;
    this.canvas.style.width = `${backW / this.dpr}px`;
    this.canvas.style.height = `${backH / this.dpr}px`;

    // 실제 contentScale은 정렬된 백버퍼에서 역산 — 콘텐츠가 정확히 백버퍼를 채운다.
    this.contentScale = backW / (width * this.dpr);
    this.contentWidth = width;
    this.contentHeight = height;
    this.applyBaseTransform();
  }

  /** ctx 변환행렬을 base 상태(dpr × contentScale)로 재설정. */
  private applyBaseTransform(): void {
    const k = this.dpr * this.contentScale;
    this.ctx.setTransform(k, 0, 0, k, 0, 0);
  }

  /** stroke 두께를 디스플레이 픽셀 의미로 보존하기 위한 보정값. */
  private deviceLineWidth(strokeWidth: number): number {
    return strokeWidth / this.contentScale;
  }

  /**
   * 화면 좌표(clientX/Y, 보통 PointerEvent에서 옴) → 콘텐츠 좌표 변환.
   * hit-test에 그대로 넣을 수 있다.
   */
  clientToContentPoint(clientX: number, clientY: number): Point {
    const rect = this.canvas.getBoundingClientRect();
    const cssX = clientX - rect.left;
    const cssY = clientY - rect.top;
    return {
      x: cssX / this.contentScale,
      y: cssY / this.contentScale,
    };
  }

  drawRect(rect: Rect, fill?: Color, stroke?: Color, strokeWidth = 1, borderRadius = 0): void {
    const ctx = this.ctx;
    ctx.beginPath();
    if (borderRadius > 0) {
      const r = Math.min(borderRadius, rect.width / 2, rect.height / 2);
      this.pathRoundedRect(rect, r);
    } else {
      ctx.rect(rect.x, rect.y, rect.width, rect.height);
    }
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = this.deviceLineWidth(strokeWidth);
      ctx.stroke();
    }
  }

  private pathRoundedRect(rect: Rect, r: number): void {
    const ctx = this.ctx;
    const { x, y, width, height } = rect;
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  drawCircle(center: Point, radius: number, fill?: Color, stroke?: Color, strokeWidth = 1): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = this.deviceLineWidth(strokeWidth);
      ctx.stroke();
    }
  }

  drawEllipse(
    center: Point,
    rx: number,
    ry: number,
    fill?: Color,
    stroke?: Color,
    rotation = 0,
  ): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.ellipse(center.x, center.y, rx, ry, rotation, 0, Math.PI * 2);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      // drawEllipse는 strokeWidth 인자가 없는 인터페이스 — 1px 의미를 디스플레이 단위로 보존.
      ctx.lineWidth = this.deviceLineWidth(1);
      ctx.stroke();
    }
  }

  drawLine(from: Point, to: Point, stroke: Color, strokeWidth: number): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = this.deviceLineWidth(strokeWidth);
    ctx.stroke();
  }

  drawPath(d: string, fill?: Color, stroke?: Color, strokeWidth = 1): void {
    const ctx = this.ctx;
    const path = new Path2D(d);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill(path);
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = this.deviceLineWidth(strokeWidth);
      ctx.stroke(path);
    }
  }

  drawText(text: string, position: Point, options: TextOptions): void {
    const ctx = this.ctx;
    this.applyTextOptions(options);
    ctx.fillStyle = options.fill ?? this.defaultFill;
    ctx.fillText(text, position.x, position.y);
  }

  measureText(text: string, options: TextOptions): Size {
    const ctx = this.ctx;
    this.applyTextOptions(options);
    const m = ctx.measureText(text);
    const ascent = m.actualBoundingBoxAscent || options.fontSize || this.defaultFontSize;
    const descent = m.actualBoundingBoxDescent || 0;
    return { width: m.width, height: ascent + descent };
  }

  private applyTextOptions(options: TextOptions): void {
    const ctx = this.ctx;
    const size = options.fontSize ?? this.defaultFontSize;
    const family = options.font ?? this.defaultFont;
    const weight = options.fontWeight ?? 'normal';
    const style = options.fontStyle ?? 'normal';
    ctx.font = `${style} ${weight} ${size}px ${family}`;
    ctx.textAlign = options.align ?? 'left';
    ctx.textBaseline = options.baseline ?? 'alphabetic';
  }

  save(): void {
    this.ctx.save();
  }

  restore(): void {
    this.ctx.restore();
  }

  translate(dx: number, dy: number): void {
    this.ctx.translate(dx, dy);
  }

  scale(sx: number, sy: number): void {
    this.ctx.scale(sx, sy);
  }

  clip(rect: Rect): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.width, rect.height);
    ctx.clip();
  }

  /** 콘텐츠 좌표계 기준 크기. resize에 입력한 (width, height) 그대로. */
  getSize(): Size {
    return { width: this.contentWidth, height: this.contentHeight };
  }

  clear(): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
    this.applyBaseTransform();
    this.clearHitAreas();
  }

  registerHitArea(id: string, rect: Rect, cursor?: string): void {
    const entry: HitArea = cursor !== undefined ? { id, rect, cursor } : { id, rect };
    this.hitAreas.push(entry);
  }

  clearHitAreas(): void {
    this.hitAreas = [];
  }

  /**
   * 웹 전용 escape hatch — `Projector` 인터페이스 외부 기능(linear/radial gradient,
   * shadow, pattern 등)을 직접 캔버스 2D ctx에 그릴 때 사용한다.
   *
   * 콜백 진입 전에 `ctx.save()`, 종료 후 `ctx.restore()`를 자동 호출해 변환행렬과
   * 스타일을 보존한다. 콜백 내부의 좌표는 `Projector`의 콘텐츠 좌표계와 동일하다
   * (현재 setTransform(dpr × contentScale, …)이 적용된 상태).
   */
  withCanvas2D(cb: (ctx: CanvasRenderingContext2D) => void): void {
    this.ctx.save();
    try {
      cb(this.ctx);
    } finally {
      this.ctx.restore();
    }
  }

  /**
   * 콜백 동안 globalAlpha를 곱셈식으로 적용한다. 콜백 종료 후 자동 복원.
   * 트랙 mute 디머처럼 다른 렌더러 호출 전체를 반투명 처리할 때 사용한다.
   */
  withGlobalAlpha(alpha: number, fn: () => void): void {
    this.ctx.save();
    this.ctx.globalAlpha *= alpha;
    try {
      fn();
    } finally {
      this.ctx.restore();
    }
  }

  getHitAreas(): readonly HitArea[] {
    return this.hitAreas;
  }
}
