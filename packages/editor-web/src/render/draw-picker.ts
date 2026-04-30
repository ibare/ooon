import type { Projector } from '@oon/shared';
import { SMUFL, BRAVURA_FONT_FAMILY } from '@oon/core';
import {
  PICKER_BAR_BG,
  PICKER_BAR_FG,
  PICKER_BG,
  PICKER_BORDER,
  PICKER_HOVER_BG,
  PICKER_ITEM_GAP,
  PICKER_ITEM_HEIGHT,
  PICKER_PADDING,
  PICKER_TEXT,
} from '../constants.js';
import type { PickerOption } from '../geometry/picker-options.js';

export interface PickerLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  rows: PickerRowRect[];
}

export interface PickerRowRect {
  index: number;
  option: PickerOption;
  x: number;
  y: number;
  width: number;
  height: number;
  /** 비율 막대 영역. */
  barX: number;
  barWidth: number;
}

export interface PickerLayoutInput {
  anchorX: number;
  anchorY: number;
  options: readonly PickerOption[];
  /** 캔버스 콘텐츠 폭 — 우측 클램프용. */
  contentWidth: number;
  /** 콘텐츠 영역의 최대 y(하단 클램프용). */
  contentHeight: number;
  /** 콘텐츠 영역의 최소 y(상단 클램프용). 기본 0. UI 오버레이 캔버스의 음수 영역(위쪽 패드)을
   * 활용하려면 음수 값을 전달한다. */
  contentMinY?: number;
}

const PICKER_WIDTH = 220;
const LABEL_WIDTH = 36;
const GLYPH_WIDTH = 22;

export function layoutPicker(input: PickerLayoutInput): PickerLayout {
  const rows: PickerRowRect[] = [];
  const innerW = PICKER_WIDTH - PICKER_PADDING * 2;
  const barX = PICKER_PADDING + LABEL_WIDTH + GLYPH_WIDTH;
  const barWidthMax = PICKER_WIDTH - barX - PICKER_PADDING;
  const totalH =
    PICKER_PADDING * 2 +
    input.options.length * PICKER_ITEM_HEIGHT +
    Math.max(0, input.options.length - 1) * PICKER_ITEM_GAP;

  const minY = input.contentMinY ?? 0;
  const x = clamp(input.anchorX, 0, input.contentWidth - PICKER_WIDTH);
  const y = clamp(input.anchorY, minY, input.contentHeight - totalH);

  for (let i = 0; i < input.options.length; i++) {
    const opt = input.options[i]!;
    const rowY = y + PICKER_PADDING + i * (PICKER_ITEM_HEIGHT + PICKER_ITEM_GAP);
    rows.push({
      index: i,
      option: opt,
      x: x + PICKER_PADDING,
      y: rowY,
      width: innerW,
      height: PICKER_ITEM_HEIGHT,
      barX: x + barX,
      barWidth: barWidthMax * Math.min(1, opt.ratio),
    });
  }
  return { x, y, width: PICKER_WIDTH, height: totalH, rows };
}

export interface DrawPickerOptions {
  hoveredIndex?: number | null;
  /** Bravura 폰트 사용 가능 시 글리프 그리기. 폰트 미로드면 텍스트 fallback. */
  glyphSize?: number;
}

export function drawPicker(
  projector: Projector,
  layout: PickerLayout,
  opts: DrawPickerOptions = {},
): void {
  projector.drawRect(
    { x: layout.x, y: layout.y, width: layout.width, height: layout.height },
    PICKER_BG,
    PICKER_BORDER,
    1,
    8,
  );
  const glyphSize = opts.glyphSize ?? 18;
  for (const row of layout.rows) {
    if (opts.hoveredIndex === row.index) {
      projector.drawRect(
        { x: row.x, y: row.y, width: row.width, height: row.height },
        PICKER_HOVER_BG,
        undefined,
        0,
        4,
      );
    }
    projector.drawText(
      formatLabel(row.option.duration),
      { x: row.x + 4, y: row.y + row.height * 0.66 },
      { font: 'system-ui, sans-serif', fontSize: 12, fill: PICKER_TEXT, align: 'left' },
    );
    const glyph = SMUFL[row.option.headGlyph];
    if (typeof glyph === 'string') {
      projector.drawText(
        glyph,
        { x: row.x + 36, y: row.y + row.height * 0.78 },
        {
          font: `${BRAVURA_FONT_FAMILY}, system-ui`,
          fontSize: glyphSize,
          fill: PICKER_TEXT,
          align: 'left',
        },
      );
    }
    projector.drawRect(
      { x: row.barX, y: row.y + row.height * 0.34, width: row.width - (row.barX - row.x), height: row.height * 0.32 },
      PICKER_BAR_BG,
      undefined,
      0,
      3,
    );
    projector.drawRect(
      { x: row.barX, y: row.y + row.height * 0.34, width: row.barWidth, height: row.height * 0.32 },
      PICKER_BAR_FG,
      undefined,
      0,
      3,
    );
    projector.registerHitArea(`picker:${row.index}`, {
      x: row.x,
      y: row.y,
      width: row.width,
      height: row.height,
    });
  }
}

function formatLabel(d: string): string {
  switch (d) {
    case 'w':
      return '온';
    case 'h.':
      return '점2';
    case 'h':
      return '2분';
    case 'q.':
      return '점4';
    case 'q':
      return '4분';
    case 'e.':
      return '점8';
    case 'e':
      return '8분';
    case 's.':
      return '점16';
    case 's':
      return '16분';
    default:
      return d;
  }
}

function clamp(v: number, lo: number, hi: number): number {
  if (hi < lo) return lo;
  return Math.max(lo, Math.min(hi, v));
}
