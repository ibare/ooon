import type { Color, HitArea, Point, Projector, Rect, Size, TextOptions } from '@ooon/shared';

export interface DrawCall {
  op: string;
  args: unknown[];
}

export class FakeProjector implements Projector {
  readonly calls: DrawCall[] = [];
  readonly hitAreas: HitArea[] = [];
  private size: Size = { width: 400, height: 400 };

  setSize(size: Size): void {
    this.size = size;
  }

  resize(
    width: number,
    height: number,
    opts?: { contentScale?: number; devicePixelRatio?: number },
  ): void {
    this.size = { width, height };
    this.calls.push({ op: 'resize', args: [width, height, opts] });
  }

  drawRect(
    rect: Rect,
    fill?: Color,
    stroke?: Color,
    strokeWidth?: number,
    borderRadius?: number,
  ): void {
    this.calls.push({ op: 'drawRect', args: [rect, fill, stroke, strokeWidth, borderRadius] });
  }
  drawCircle(center: Point, radius: number, fill?: Color, stroke?: Color, strokeWidth?: number): void {
    this.calls.push({ op: 'drawCircle', args: [center, radius, fill, stroke, strokeWidth] });
  }
  drawEllipse(
    center: Point,
    rx: number,
    ry: number,
    fill?: Color,
    stroke?: Color,
    rotation?: number,
  ): void {
    this.calls.push({ op: 'drawEllipse', args: [center, rx, ry, fill, stroke, rotation] });
  }
  drawLine(from: Point, to: Point, stroke: Color, strokeWidth: number): void {
    this.calls.push({ op: 'drawLine', args: [from, to, stroke, strokeWidth] });
  }
  drawPath(d: string, fill?: Color, stroke?: Color, strokeWidth?: number): void {
    this.calls.push({ op: 'drawPath', args: [d, fill, stroke, strokeWidth] });
  }
  drawText(text: string, position: Point, options: TextOptions): void {
    this.calls.push({ op: 'drawText', args: [text, position, options] });
  }
  measureText(text: string, options: TextOptions): Size {
    const size = options.fontSize ?? 14;
    return { width: text.length * size * 0.5, height: size };
  }
  save(): void {
    this.calls.push({ op: 'save', args: [] });
  }
  restore(): void {
    this.calls.push({ op: 'restore', args: [] });
  }
  translate(dx: number, dy: number): void {
    this.calls.push({ op: 'translate', args: [dx, dy] });
  }
  scale(sx: number, sy: number): void {
    this.calls.push({ op: 'scale', args: [sx, sy] });
  }
  clip(rect: Rect): void {
    this.calls.push({ op: 'clip', args: [rect] });
  }
  getSize(): Size {
    return this.size;
  }
  clear(): void {
    this.calls.push({ op: 'clear', args: [] });
    this.hitAreas.length = 0;
  }
  registerHitArea(id: string, rect: Rect, cursor?: string): void {
    const entry: HitArea = cursor !== undefined ? { id, rect, cursor } : { id, rect };
    this.hitAreas.push(entry);
  }
  clearHitAreas(): void {
    this.hitAreas.length = 0;
  }

  countOps(op: string): number {
    return this.calls.filter((c) => c.op === op).length;
  }
  callsOf(op: string): DrawCall[] {
    return this.calls.filter((c) => c.op === op);
  }
  texts(): string[] {
    return this.callsOf('drawText').map((c) => c.args[0] as string);
  }
}
