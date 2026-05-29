import { describe, expect, it } from 'vitest';
import type {
  Color,
  HitArea,
  Point,
  Projector,
  Rect,
  Size,
  TextOptions,
} from '@ooon/shared';
import { renderBlockToProjector } from './block-render.js';
import { OoonRenderError } from './errors.js';

interface DrawCall {
  op: string;
  args: unknown[];
}

class FakeProjector implements Projector {
  readonly calls: DrawCall[] = [];
  readonly hitAreas: HitArea[] = [];

  resize(
    width: number,
    height: number,
    opts?: { contentScale?: number; devicePixelRatio?: number },
  ): void {
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
  drawCircle(
    center: Point,
    radius: number,
    fill?: Color,
    stroke?: Color,
    strokeWidth?: number,
  ): void {
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
    return { width: 400, height: 400 };
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
}

describe('renderBlockToProjector', () => {
  it('clears the projector and returns a positive height for a score block', () => {
    const p = new FakeProjector();
    const res = renderBlockToProjector(p, 'score 4/4\n  C4/q D4/q E4/q F4/q |', {
      width: 400,
    });
    expect(p.countOps('clear')).toBe(1);
    expect(res.height).toBeGreaterThan(0);
    expect(Array.isArray(res.warnings)).toBe(true);
  });

  it('renders a drum block', () => {
    const p = new FakeProjector();
    const res = renderBlockToProjector(p, 'drum 4/4\n  HH | x-x-x-x- |', { width: 400 });
    expect(res.height).toBeGreaterThan(0);
    expect(p.calls.length).toBeGreaterThan(1);
  });

  it('renders a progression block', () => {
    const p = new FakeProjector();
    const res = renderBlockToProjector(p, 'progression 4/4 in:C\n  I | V | vi | IV |', {
      width: 400,
    });
    expect(res.height).toBeGreaterThan(0);
  });

  it('renders a fretboard block and returns empty warnings', () => {
    const p = new FakeProjector();
    const res = renderBlockToProjector(p, 'fretboard C major', { width: 400 });
    expect(res.height).toBeGreaterThan(0);
    expect(res.warnings).toEqual([]);
  });

  it('wraps parse errors in OoonRenderError with original cause', () => {
    const p = new FakeProjector();
    expect(() =>
      renderBlockToProjector(p, '!!!not-a-valid-block!!!', { width: 400 }),
    ).toThrow(OoonRenderError);
  });
});
