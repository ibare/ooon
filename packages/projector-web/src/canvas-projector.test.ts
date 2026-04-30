import { describe, expect, it } from 'vitest';
import { CanvasProjector } from './canvas-projector.js';

interface RecordedCtx {
  transforms: number[][];
  lineWidths: number[];
  clearRects: number[][];
  resetTransformCount: number;
  saveCount: number;
  restoreCount: number;
}

function createMockCanvas(boundingRect: { left: number; top: number } = { left: 0, top: 0 }) {
  const recorded: RecordedCtx = {
    transforms: [],
    lineWidths: [],
    clearRects: [],
    resetTransformCount: 0,
    saveCount: 0,
    restoreCount: 0,
  };

  const ctx: Record<string, unknown> = {
    setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
      recorded.transforms.push([a, b, c, d, e, f]);
      // (1,0,0,1,0,0) 행렬은 reset(identity)로 카운트
      if (a === 1 && b === 0 && c === 0 && d === 1 && e === 0 && f === 0) {
        recorded.resetTransformCount += 1;
      }
    },
    save(): void {
      recorded.saveCount += 1;
    },
    restore(): void {
      recorded.restoreCount += 1;
    },
    clearRect(x: number, y: number, w: number, h: number): void {
      recorded.clearRects.push([x, y, w, h]);
    },
    beginPath(): void {},
    rect(): void {},
    arc(): void {},
    ellipse(): void {},
    moveTo(): void {},
    lineTo(): void {},
    quadraticCurveTo(): void {},
    closePath(): void {},
    fill(): void {},
    stroke(): void {},
    fillText(): void {},
    measureText(t: string) {
      return {
        width: t.length * 7,
        actualBoundingBoxAscent: 10,
        actualBoundingBoxDescent: 2,
      };
    },
    clip(): void {},
    translate(): void {},
    scale(): void {},
    fillStyle: '#000',
    strokeStyle: '#000',
    font: '',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    _lineWidth: 1,
    get lineWidth(): number {
      return this._lineWidth as number;
    },
    set lineWidth(v: number) {
      this._lineWidth = v;
      recorded.lineWidths.push(v);
    },
  };

  const canvas = {
    width: 0,
    height: 0,
    style: { width: '', height: '' } as { width: string; height: string },
    getContext(type: string): unknown {
      return type === '2d' ? ctx : null;
    },
    getBoundingClientRect() {
      const w = parseFloat((canvas as { style: { width: string } }).style.width) || 0;
      const h = parseFloat((canvas as { style: { height: string } }).style.height) || 0;
      return {
        left: boundingRect.left,
        top: boundingRect.top,
        right: boundingRect.left + w,
        bottom: boundingRect.top + h,
        width: w,
        height: h,
        x: boundingRect.left,
        y: boundingRect.top,
        toJSON(): unknown {
          return {};
        },
      };
    },
  };

  return { canvas: canvas as unknown as HTMLCanvasElement, ctx, recorded };
}

describe('CanvasProjector', () => {
  describe('resize + base transform', () => {
    it('contentScale=1 dpr=1: 백버퍼는 콘텐츠 크기와 동일, 행렬은 identity', () => {
      const { canvas, recorded } = createMockCanvas();
      const p = new CanvasProjector(canvas, { devicePixelRatio: 1 });
      p.resize(400, 200);
      expect(canvas.width).toBe(400);
      expect(canvas.height).toBe(200);
      expect(canvas.style.width).toBe('400px');
      expect(canvas.style.height).toBe('200px');
      // 마지막 setTransform은 base transform — identity
      const last = recorded.transforms[recorded.transforms.length - 1];
      expect(last).toEqual([1, 0, 0, 1, 0, 0]);
    });

    it('contentScale=1 dpr=2: 백버퍼는 콘텐츠×2, base transform은 (2,0,0,2,0,0)', () => {
      const { canvas, recorded } = createMockCanvas();
      const p = new CanvasProjector(canvas, { devicePixelRatio: 2 });
      p.resize(400, 200);
      expect(canvas.width).toBe(800);
      expect(canvas.height).toBe(400);
      expect(canvas.style.width).toBe('400px');
      const last = recorded.transforms[recorded.transforms.length - 1];
      expect(last).toEqual([2, 0, 0, 2, 0, 0]);
    });

    it('contentScale=0.5 dpr=2: 백버퍼는 콘텐츠×0.5×2=콘텐츠 그대로, base transform은 (1,0,0,1,0,0)', () => {
      const { canvas, recorded } = createMockCanvas();
      const p = new CanvasProjector(canvas, { devicePixelRatio: 2 });
      p.resize(400, 200, { contentScale: 0.5 });
      expect(canvas.width).toBe(400);
      expect(canvas.height).toBe(200);
      // CSS 폭은 백버퍼/dpr = 200 (컨테이너 안에 들어가는 시각적 크기)
      expect(canvas.style.width).toBe('200px');
      const last = recorded.transforms[recorded.transforms.length - 1];
      expect(last).toEqual([1, 0, 0, 1, 0, 0]);
    });

    it('정수 픽셀 정렬: 비정수 contentScale도 백버퍼는 정수 픽셀(floor — 컨테이너 초과 금지)', () => {
      const { canvas } = createMockCanvas();
      const p = new CanvasProjector(canvas, { devicePixelRatio: 1 });
      p.resize(300, 100, { contentScale: 0.333 });
      // 300 × 0.333 × 1 = 99.9 → floor 99 (컨테이너 폭을 절대 초과하지 않도록)
      expect(canvas.width).toBe(99);
      expect(Number.isInteger(canvas.width)).toBe(true);
      expect(Number.isInteger(canvas.height)).toBe(true);
    });

    it('잘못된 입력은 throw', () => {
      const { canvas } = createMockCanvas();
      const p = new CanvasProjector(canvas, { devicePixelRatio: 1 });
      expect(() => p.resize(0, 100)).toThrow();
      expect(() => p.resize(100, 0)).toThrow();
      expect(() => p.resize(100, 100, { contentScale: 0 })).toThrow();
      expect(() => p.resize(100, 100, { contentScale: -1 })).toThrow();
      expect(() => p.resize(100, 100, { devicePixelRatio: 0 })).toThrow();
    });
  });

  describe('clear', () => {
    it('clear()는 identity로 reset → clearRect → base transform 복원 순서', () => {
      const { canvas, recorded } = createMockCanvas();
      const p = new CanvasProjector(canvas, { devicePixelRatio: 2 });
      p.resize(400, 200, { contentScale: 0.5 });
      const transformsBefore = recorded.transforms.length;

      p.clear();

      // clear는 save → setTransform(identity) → clearRect → restore → base
      // 마지막 transform은 base(=(1,0,0,1,0,0)) 다시 적용
      const after = recorded.transforms.slice(transformsBefore);
      expect(after.length).toBeGreaterThanOrEqual(1);
      const last = after[after.length - 1];
      expect(last).toEqual([1, 0, 0, 1, 0, 0]);
      expect(recorded.clearRects.length).toBe(1);
      // clearRect는 백버퍼 전체 = (0,0,400,200)
      expect(recorded.clearRects[0]).toEqual([0, 0, 400, 200]);
    });
  });

  describe('stroke 두께 보존', () => {
    it('contentScale=1: drawLine strokeWidth=2 → ctx.lineWidth=2', () => {
      const { canvas, recorded } = createMockCanvas();
      const p = new CanvasProjector(canvas, { devicePixelRatio: 1 });
      p.resize(400, 200);
      p.drawLine({ x: 0, y: 0 }, { x: 100, y: 0 }, '#000', 2);
      expect(recorded.lineWidths.at(-1)).toBe(2);
    });

    it('contentScale=0.5: strokeWidth=2 → ctx.lineWidth=4 (1/CS 보정)', () => {
      const { canvas, recorded } = createMockCanvas();
      const p = new CanvasProjector(canvas, { devicePixelRatio: 2 });
      p.resize(400, 200, { contentScale: 0.5 });
      p.drawLine({ x: 0, y: 0 }, { x: 100, y: 0 }, '#000', 2);
      expect(recorded.lineWidths.at(-1)).toBeCloseTo(4, 6);
    });

    it('drawRect stroke도 동일 보정', () => {
      const { canvas, recorded } = createMockCanvas();
      const p = new CanvasProjector(canvas, { devicePixelRatio: 1 });
      p.resize(400, 200, { contentScale: 0.25 });
      p.drawRect({ x: 0, y: 0, width: 10, height: 10 }, undefined, '#000', 1);
      expect(recorded.lineWidths.at(-1)).toBeCloseTo(4, 6);
    });

    it('drawCircle stroke 보정', () => {
      const { canvas, recorded } = createMockCanvas();
      const p = new CanvasProjector(canvas, { devicePixelRatio: 1 });
      p.resize(400, 200, { contentScale: 0.5 });
      p.drawCircle({ x: 50, y: 50 }, 10, undefined, '#000', 3);
      expect(recorded.lineWidths.at(-1)).toBeCloseTo(6, 6);
    });

    it('drawEllipse stroke는 1px 의미를 보존(보정 적용)', () => {
      const { canvas, recorded } = createMockCanvas();
      const p = new CanvasProjector(canvas, { devicePixelRatio: 1 });
      p.resize(400, 200, { contentScale: 0.5 });
      p.drawEllipse({ x: 50, y: 50 }, 10, 5, undefined, '#000');
      expect(recorded.lineWidths.at(-1)).toBeCloseTo(2, 6);
    });
  });

  describe('clientToContentPoint', () => {
    it('contentScale=1: client 좌표는 콘텐츠 좌표와 동일(rect.left/top 차감 후)', () => {
      const { canvas } = createMockCanvas({ left: 10, top: 20 });
      const p = new CanvasProjector(canvas, { devicePixelRatio: 1 });
      p.resize(400, 200);
      const pt = p.clientToContentPoint(60, 70);
      expect(pt.x).toBeCloseTo(50, 6);
      expect(pt.y).toBeCloseTo(50, 6);
    });

    it('contentScale=0.5: CSS 좌표를 contentScale로 나눠 콘텐츠 좌표 복원', () => {
      const { canvas } = createMockCanvas({ left: 0, top: 0 });
      const p = new CanvasProjector(canvas, { devicePixelRatio: 1 });
      p.resize(400, 200, { contentScale: 0.5 });
      // canvas.style.width = '200px' (백버퍼 200/dpr=1)
      // CSS x=100 → 콘텐츠 x=100/0.5=200
      const pt = p.clientToContentPoint(100, 50);
      expect(pt.x).toBeCloseTo(200, 6);
      expect(pt.y).toBeCloseTo(100, 6);
    });
  });

  describe('getSize', () => {
    it('콘텐츠 단위 크기 반환', () => {
      const { canvas } = createMockCanvas();
      const p = new CanvasProjector(canvas, { devicePixelRatio: 2 });
      p.resize(400, 200, { contentScale: 0.5 });
      const s = p.getSize();
      expect(s.width).toBe(400);
      expect(s.height).toBe(200);
    });
  });
});
