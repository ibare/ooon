import type { Projector } from '@oon/shared';
import { SMUFL, BRAVURA_FONT_FAMILY } from '@oon/core';
import {
  PICKER_BG,
  PICKER_BORDER,
  PICKER_EMPTY_BG,
  PICKER_GLYPH_SIZE,
  PICKER_HOVER_BG,
  PICKER_PADDING,
  PICKER_TEXT,
  PICKER_TILE_GAP,
  PICKER_TILE_SIZE,
} from '../constants.js';
import type { PickerOption } from '../geometry/picker-options.js';

export interface PickerLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  /** 옵션이 채워진 셀(row-major 순서). hit/click 대상. */
  rows: PickerRowRect[];
  /** 옵션 없는 빈 셀. 시각용, hit area 등록 안 함. */
  emptyCells: PickerEmptyCellRect[];
}

export interface PickerRowRect {
  index: number;
  option: PickerOption;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PickerEmptyCellRect {
  x: number;
  y: number;
  width: number;
  height: number;
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

export function layoutPicker(input: PickerLayoutInput): PickerLayout {
  // 옵션 개수에 맞춰 그리드 크기 결정. 1개→1x1, 2~4개→2x2, 5~9개→3x3, 10~16개→4x4, 17~25개→5x5.
  const gridN = Math.max(1, Math.ceil(Math.sqrt(input.options.length)));
  const totalSize = PICKER_TILE_SIZE * gridN + PICKER_TILE_GAP * (gridN - 1) + PICKER_PADDING * 2;
  const minY = input.contentMinY ?? 0;
  const x = clamp(input.anchorX, 0, input.contentWidth - totalSize);
  const y = clamp(input.anchorY, minY, input.contentHeight - totalSize);

  const cellAt = (r: number, c: number): { x: number; y: number; width: number; height: number } => ({
    x: x + PICKER_PADDING + c * (PICKER_TILE_SIZE + PICKER_TILE_GAP),
    y: y + PICKER_PADDING + r * (PICKER_TILE_SIZE + PICKER_TILE_GAP),
    width: PICKER_TILE_SIZE,
    height: PICKER_TILE_SIZE,
  });

  const rows: PickerRowRect[] = [];
  const emptyCells: PickerEmptyCellRect[] = [];
  for (let r = 0; r < gridN; r++) {
    for (let c = 0; c < gridN; c++) {
      const i = r * gridN + c;
      const rect = cellAt(r, c);
      if (i < input.options.length) {
        rows.push({ index: i, option: input.options[i]!, ...rect });
      } else {
        emptyCells.push(rect);
      }
    }
  }
  return { x, y, width: totalSize, height: totalSize, rows, emptyCells };
}

export interface DrawPickerOptions {
  hoveredIndex?: number | null;
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
  for (const c of layout.emptyCells) {
    projector.drawRect(
      { x: c.x, y: c.y, width: c.width, height: c.height },
      PICKER_EMPTY_BG,
      undefined,
      0,
      4,
    );
  }
  for (const row of layout.rows) {
    if (opts.hoveredIndex === row.index) {
      projector.drawRect(
        { x: row.x, y: row.y, width: row.width, height: row.height },
        PICKER_HOVER_BG,
        undefined,
        0,
        4,
      );
    } else {
      projector.drawRect(
        { x: row.x, y: row.y, width: row.width, height: row.height },
        PICKER_EMPTY_BG,
        undefined,
        0,
        4,
      );
    }
    // 글리프 baseline은 셀 하단 가까이 — stem이 위로 솟아 셀 안에 자리잡도록.
    const glyphX = row.x + row.width * 0.32;
    const baselineY = row.y + row.height * 0.78;
    projector.drawText(
      SMUFL[row.option.glyph],
      { x: glyphX, y: baselineY },
      {
        font: `${BRAVURA_FONT_FAMILY}, system-ui`,
        fontSize: PICKER_GLYPH_SIZE,
        fill: PICKER_TEXT,
        align: 'left',
      },
    );
    if (row.option.dotted) {
      projector.drawText(
        SMUFL.augmentationDot,
        { x: glyphX + PICKER_GLYPH_SIZE * 0.5, y: baselineY },
        {
          font: `${BRAVURA_FONT_FAMILY}, system-ui`,
          fontSize: PICKER_GLYPH_SIZE,
          fill: PICKER_TEXT,
          align: 'left',
        },
      );
    }
    projector.registerHitArea(`picker:${row.index}`, {
      x: row.x,
      y: row.y,
      width: row.width,
      height: row.height,
    });
  }
}

function clamp(v: number, lo: number, hi: number): number {
  if (hi < lo) return lo;
  return Math.max(lo, Math.min(hi, v));
}

