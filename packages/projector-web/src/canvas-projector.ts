import type { Color, HitArea, Point, Projector, Rect, Size, TextOptions } from '@oon/shared';

export interface CanvasProjectorOptions {
  devicePixelRatio?: number;
  defaultFont?: string;
  defaultFontSize?: number;
  defaultFill?: Color;
}

export class CanvasProjector implements Projector {
  readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly dpr: number;
  private readonly defaultFont: string;
  private readonly defaultFontSize: number;
  private readonly defaultFill: Color;
  private hitAreas: HitArea[] = [];

  constructor(canvas: HTMLCanvasElement, opts: CanvasProjectorOptions = {}) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('CanvasProjector: 2D context not available');
    this.canvas = canvas;
    this.ctx = ctx;
    this.dpr = opts.devicePixelRatio ?? (typeof window !== 'undefined' ? window.devicePixelRatio : 1) ?? 1;
    this.defaultFont = opts.defaultFont ?? 'system-ui, sans-serif';
    this.defaultFontSize = opts.defaultFontSize ?? 14;
    this.defaultFill = opts.defaultFill ?? '#111827';
    this.applyDpr();
  }

  resize(width: number, height: number): void {
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.applyDpr();
  }

  private applyDpr(): void {
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
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
      ctx.lineWidth = strokeWidth;
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
      ctx.lineWidth = strokeWidth;
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
      ctx.stroke();
    }
  }

  drawLine(from: Point, to: Point, stroke: Color, strokeWidth: number): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
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
      ctx.lineWidth = strokeWidth;
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

  getSize(): Size {
    return {
      width: this.canvas.width / this.dpr,
      height: this.canvas.height / this.dpr,
    };
  }

  clear(): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
    this.applyDpr();
    this.clearHitAreas();
  }

  registerHitArea(id: string, rect: Rect, cursor?: string): void {
    const entry: HitArea = cursor !== undefined ? { id, rect, cursor } : { id, rect };
    this.hitAreas.push(entry);
  }

  clearHitAreas(): void {
    this.hitAreas = [];
  }

  getHitAreas(): readonly HitArea[] {
    return this.hitAreas;
  }
}
