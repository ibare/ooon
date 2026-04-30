import type { Projector } from '@oon/shared';
import type { KeyLayout, KeyboardLayout } from '@oon/instrument-layouts';
import { CanvasProjector } from '../canvas-projector.js';
import { FONT, METRICS, THEME } from '../theme.js';

export interface KeyboardRenderOptions {
  originX?: number;
  originY?: number;
  /** 평소 라벨 표시 여부. true면 C 건반에만 옥타브 라벨(C3, C4 등)을 표시한다. */
  showLabels?: boolean;
}

/**
 * 입체감 있는 피아노 건반을 그린다.
 * - CanvasProjector이면 그라디언트/그림자를 적용한 풍부 렌더링.
 * - 그 외 백엔드(테스트용 FakeProjector 등)는 단순 사각형 폴백.
 */
export function renderKeyboard(
  projector: Projector,
  layout: KeyboardLayout,
  opts: KeyboardRenderOptions = {},
): void {
  const ox = opts.originX ?? 0;
  const oy = opts.originY ?? 0;
  const showLabels = opts.showLabels ?? false;

  projector.save();
  projector.translate(ox, oy);

  if (projector instanceof CanvasProjector) {
    drawRichKeyboard(projector, layout, showLabels);
  } else {
    drawFlatKeyboard(projector, layout, showLabels);
  }

  for (const key of layout.keys) {
    projector.registerHitArea(`key:${key.midi}`, key.rect, 'pointer');
  }

  projector.restore();
}

function drawRichKeyboard(
  projector: CanvasProjector,
  layout: KeyboardLayout,
  showLabels: boolean,
): void {
  projector.withCanvas2D((ctx) => {
    for (const key of layout.keys) {
      if (key.isBlack) continue;
      drawWhiteKeyDefault(ctx, key);
    }
    for (const key of layout.keys) {
      if (!key.isBlack) continue;
      drawBlackKeyDefault(ctx, key);
    }
    if (showLabels) {
      for (const key of layout.keys) {
        if (key.isBlack) continue;
        if (((key.midi % 12) + 12) % 12 !== 0) continue;
        drawCLabel(ctx, key);
      }
    }
  });
}

function drawFlatKeyboard(
  projector: Projector,
  layout: KeyboardLayout,
  showLabels: boolean,
): void {
  for (const key of layout.keys) {
    if (key.isBlack) continue;
    projector.drawRect(key.rect, THEME.whiteKey, THEME.whiteKeyStroke, METRICS.stroke);
    if (showLabels && key.label) {
      projector.drawText(
        key.label,
        { x: key.rect.x + key.rect.width / 2, y: key.rect.y + key.rect.height - 10 },
        { font: FONT.ui, fontSize: 10, fill: THEME.keyLabel, align: 'center', baseline: 'bottom' },
      );
    }
  }
  for (const key of layout.keys) {
    if (!key.isBlack) continue;
    projector.drawRect(key.rect, THEME.blackKey, THEME.whiteKeyStroke, METRICS.stroke);
    if (showLabels && key.label) {
      projector.drawText(
        key.label,
        { x: key.rect.x + key.rect.width / 2, y: key.rect.y + key.rect.height - 6 },
        { font: FONT.ui, fontSize: 9, fill: THEME.whiteKey, align: 'center', baseline: 'bottom' },
      );
    }
  }
}

export function drawWhiteKeyDefault(ctx: CanvasRenderingContext2D, key: KeyLayout): void {
  const { x, y, width: w, height: h } = key.rect;

  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, '#FEFEFE');
  grad.addColorStop(0.85, '#F8F5F0');
  grad.addColorStop(1, '#F0ECE4');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  // 우측 경계: 1px 어두운 선 + 그 위 0.5px 밝은 하이라이트
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.fillRect(x + w - 1, y, 1, h);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillRect(x + w - 0.5, y, 0.5, h);

  // 하단 엣지(3D 효과)
  ctx.fillStyle = 'rgba(0,0,0,0.05)';
  ctx.fillRect(x, y + h - 1.5, w, 1.5);
}

export function drawBlackKeyDefault(ctx: CanvasRenderingContext2D, key: KeyLayout): void {
  const { x, y, width: w, height: h } = key.rect;
  const r = Math.min(METRICS.blackKeyRadius, w / 2, h / 2);

  // body — 하단 라운드 사각형 + 그라디언트 + 그림자
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 3;
  pathBlackKeyShape(ctx, x, y, w, h, r);
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, '#1A1A1A');
  grad.addColorStop(0.65, '#282828');
  grad.addColorStop(0.92, '#1E1E1E');
  grad.addColorStop(1, '#3E3E3E');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();

  // 상단 6px 반사광
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, Math.min(6, h));
  ctx.clip();
  pathBlackKeyShape(ctx, x, y, w, h, r);
  const refl = ctx.createLinearGradient(x, y, x, y + 6);
  refl.addColorStop(0, 'rgba(255,255,255,0.08)');
  refl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = refl;
  ctx.fill();
  ctx.restore();

  // 좌측 0.5px 측면 반사
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.fillRect(x, y, 0.5, h - r);
}

function pathBlackKeyShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.closePath();
}

function drawCLabel(ctx: CanvasRenderingContext2D, key: KeyLayout): void {
  const cx = key.rect.x + key.rect.width / 2;
  const cy = key.rect.y + key.rect.height - 6;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.font = `9px ${FONT.ui}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(key.label ?? '', cx, cy);
  ctx.restore();
}
