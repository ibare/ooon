import type { Color, Point, Rect, Size, TextOptions } from './types.js';

export interface Projector {
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
