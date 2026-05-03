// ─────────────────────────────────────────────────────────────────────────────
// picker 위젯 트리 빌더.
//
// 외부에서 옵션·active·hovered token만 넘기면 picker 외곽 widget을 반환한다.
// 위젯 트리 구조:
//   Panel (배경+테두리)
//     Padding
//       Column
//         ToggleGroup     (카테고리 토글: 음표/점음표/쉼표/점쉼표 또는 단순/복합)
//         Grid            (필터된 옵션 셀들)
//           Button(셀)    (token = 'picker:cell:N')
//             Stack/Glyph (option별 시각: 음표·쉼표·박자 분자/분모)
//
// 매 paint/hitTest 호출마다 build → measure → clamp → layout → paint(또는 hitTest).
// 위젯은 mutable layout state만 들고 콜백은 없으므로 매번 새 인스턴스로 생성해도 안전.
// ─────────────────────────────────────────────────────────────────────────────

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
  PICKER_TIMESIG_INTERNAL_PAD,
  PICKER_TOGGLE_ACTIVE_BG,
  PICKER_TOGGLE_ACTIVE_RADIUS,
  PICKER_TOGGLE_HEIGHT,
  PICKER_TOGGLE_HOVER_BG,
  PICKER_TOGGLE_LABEL_SIZE,
  PICKER_TOGGLE_TRACK_BG,
  PICKER_TOGGLE_TRACK_BORDER,
  PICKER_TOGGLE_TRACK_PAD,
  PICKER_TOGGLE_TRACK_RADIUS,
  PICKER_TOGGLE_WIDTH,
} from '../constants.js';
import {
  AUGMENTATION_DOT_GLYPH,
  PICKER_CATEGORY_SPECS,
  type PickerContext,
} from '../geometry/picker-categories.js';
import type { PickerOption } from '../geometry/picker-options.js';
import {
  Button,
  Column,
  Glyph,
  Grid,
  Label,
  Padding,
  Panel,
  Stack,
  ToggleGroup,
  UNCONSTRAINED,
  allInset,
  type Rect,
  type ToggleGroupItem,
  type Widget,
} from '../ui/index.js';

export const PICKER_TOKEN_CELL_PREFIX = 'picker:cell';
export const PICKER_TOKEN_TOGGLE_PREFIX = 'picker:toggle';

export interface BuildPickerWidgetInput {
  context: PickerContext;
  /** 활성 카테고리로 필터된 옵션. row-major로 그리드에 채워진다. */
  filteredOptions: readonly PickerOption[];
  active: ReadonlySet<string>;
  /** 현재 hover 중인 hit token(전체 형식: 'picker:cell:N' 또는 'picker:toggle:id'). null이면 hover 없음. */
  hoveredToken: string | null;
}

/**
 * picker 위젯 트리를 빌드해서 반환. 호출 측은 measure → layout → paint(또는 hitTest).
 * 매 호출마다 새 인스턴스 — 동일 props에 대해 결정적 결과.
 */
export function buildPickerWidget(input: BuildPickerWidgetInput): Widget {
  const spec = PICKER_CATEGORY_SPECS[input.context];

  const toggleItems: ToggleGroupItem[] = spec.categories.map((cat) => ({
    id: cat.id,
    child: new Label({
      text: cat.label,
      fontSize: PICKER_TOGGLE_LABEL_SIZE,
      fill: PICKER_TEXT,
      align: 'center',
      baseline: 'middle',
      width: PICKER_TOGGLE_WIDTH,
      height: PICKER_TOGGLE_HEIGHT,
    }),
  }));

  const toggleHoveredId = parseHoveredId(input.hoveredToken, PICKER_TOKEN_TOGGLE_PREFIX);

  const toggle = new ToggleGroup({
    tokenPrefix: PICKER_TOKEN_TOGGLE_PREFIX,
    mode: spec.mode,
    items: toggleItems,
    active: input.active,
    hoveredId: toggleHoveredId,
    itemWidth: PICKER_TOGGLE_WIDTH,
    itemHeight: PICKER_TOGGLE_HEIGHT,
    trackFill: PICKER_TOGGLE_TRACK_BG,
    trackStroke: PICKER_TOGGLE_TRACK_BORDER,
    trackPadding: PICKER_TOGGLE_TRACK_PAD,
    trackRadius: PICKER_TOGGLE_TRACK_RADIUS,
    activeFill: PICKER_TOGGLE_ACTIVE_BG,
    activeInsetRadius: PICKER_TOGGLE_ACTIVE_RADIUS,
    hoveredFill: PICKER_TOGGLE_HOVER_BG,
  });

  const cellHoveredIndex = parseHoveredCellIndex(input.hoveredToken);
  const cells: Widget[] = input.filteredOptions.map((opt, i) => {
    const child = buildCellContent(opt);
    return new Button({
      token: `${PICKER_TOKEN_CELL_PREFIX}:${i}`,
      child,
      fill: PICKER_EMPTY_BG,
      hoveredFill: PICKER_HOVER_BG,
      hovered: cellHoveredIndex === i,
      borderRadius: 4,
      width: PICKER_TILE_SIZE,
      height: PICKER_TILE_SIZE,
    });
  });

  const cols = Math.max(1, Math.ceil(Math.sqrt(Math.max(1, input.filteredOptions.length))));
  const grid = new Grid({
    cols,
    cellWidth: PICKER_TILE_SIZE,
    cellHeight: PICKER_TILE_SIZE,
    gap: PICKER_TILE_GAP,
    children: cells,
    emptyCellFill: PICKER_EMPTY_BG,
    emptyCellRadius: 4,
  });

  // 토글바 폭이 그리드 폭보다 좁아도 Column은 자식 최대 폭으로 자기 폭 결정 → 외곽이 그리드 폭에 맞춰짐.
  return new Panel({
    fill: PICKER_BG,
    stroke: PICKER_BORDER,
    strokeWidth: 1,
    borderRadius: 8,
    child: new Padding({
      insets: allInset(PICKER_PADDING),
      child: new Column({
        gap: PICKER_TILE_GAP,
        align: 'start',
        children: [toggle, grid],
      }),
    }),
  });
}

/**
 * picker 위젯을 빌드하고 anchor를 콘텐츠 영역에 클램프한 절대 rect를 반환한다.
 * 외부(score-editor)는 이 함수 한 번 호출 → paint나 hitTest 둘 중 하나 수행.
 */
export interface PlacePickerInput extends BuildPickerWidgetInput {
  anchorX: number;
  anchorY: number;
  contentWidth: number;
  contentHeight: number;
  /** 위쪽 패드 활용을 위한 음수 허용 minY. 기본 0. */
  contentMinY?: number;
}

export interface PlacedPicker {
  widget: Widget;
  rect: Rect;
}

export function buildAndPlacePicker(input: PlacePickerInput): PlacedPicker {
  const widget = buildPickerWidget(input);
  const size = widget.measure(UNCONSTRAINED);
  const minY = input.contentMinY ?? 0;
  const x = clamp(input.anchorX, 0, input.contentWidth - size.width);
  const y = clamp(input.anchorY, minY, input.contentHeight - size.height);
  const rect: Rect = { x, y, width: size.width, height: size.height };
  widget.layout(rect);
  return { widget, rect };
}

// ─── 셀 콘텐츠 빌더 ─────────────────────────────────────────────────────────────

function buildCellContent(opt: PickerOption): Widget {
  if (opt.kind === 'setTimeSignature') {
    const fontSize = (PICKER_TILE_SIZE - PICKER_TIMESIG_INTERNAL_PAD * 2) / 2;
    // Stack에 분자(상단), 분모(하단) 두 글리프를 절대 위치 기반으로 두기 위해
    // 셀 안 가운데 25%/75% 위치에 글리프를 그리는 방법: Glyph 자체 align/baseline 활용.
    return new Stack({
      children: [
        new Glyph({
          glyph: opt.topGlyph,
          fontSize,
          fill: PICKER_TEXT,
          align: 'center',
          baseline: 'middle',
          width: PICKER_TILE_SIZE,
          height: PICKER_TILE_SIZE / 2,
        }),
        new TimeSigBottomHalf({
          glyph: opt.bottomGlyph,
          fontSize,
        }),
      ],
    });
  }
  return new NoteOrRestCellContent({ glyph: opt.glyph, dotted: opt.dotted });
}

// ─── 위젯: 음표/쉼표 셀 콘텐츠 ───────────────────────────────────────────────────
//
// 기존 draw-picker의 시각: 글리프는 셀 좌측 32% 지점, baseline 78%. dotted면 글리프 옆에
// augmentationDot. Stem이 위로 솟는 SMuFL 음표 글리프를 셀 안에 자리잡도록 한 정렬이다.

import {
  pointInRect,
  type Constraints,
  type Point,
  type Size,
  type Widget as W,
} from '../ui/widget.js';
import type { Color, Projector } from '@oon/shared';
import { BRAVURA_FONT_FAMILY, SMUFL, type GlyphName } from '@oon/core';

interface NoteOrRestCellProps {
  /** SMuFL 글리프 이름(예: 'noteQuarterUp'). paint 시 SMUFL[name]으로 코드포인트 변환. */
  glyph: GlyphName;
  dotted: boolean;
}

class NoteOrRestCellContent implements W {
  private rect: Rect = { x: 0, y: 0, width: 0, height: 0 };

  constructor(private readonly props: NoteOrRestCellProps) {}

  measure(_c: Constraints): Size {
    return { width: PICKER_TILE_SIZE, height: PICKER_TILE_SIZE };
  }

  layout(rect: Rect): void {
    this.rect = rect;
  }

  paint(projector: Projector): void {
    const glyphX = this.rect.x + this.rect.width * 0.32;
    const baselineY = this.rect.y + this.rect.height * 0.78;
    // SMUFL 객체엔 timeSigNumber(함수)도 섞여 있어 union이 string|function이지만,
    // picker-options에서 PickerOption.glyph는 항상 정적 글리프 키(예: noteQuarterUp)만 들어온다.
    const codepoint = SMUFL[this.props.glyph] as string;
    drawGlyphAt(projector, codepoint, glyphX, baselineY, PICKER_GLYPH_SIZE, PICKER_TEXT, 'left', 'alphabetic');
    if (this.props.dotted) {
      drawGlyphAt(
        projector,
        AUGMENTATION_DOT_GLYPH,
        glyphX + PICKER_GLYPH_SIZE * 0.5,
        baselineY,
        PICKER_GLYPH_SIZE,
        PICKER_TEXT,
        'left',
        'alphabetic',
      );
    }
  }

  hitTest(p: Point): string | null {
    return pointInRect(this.rect, p) ? null : null;
  }
}

// ─── 위젯: 박자 셀의 분모(셀 하반부 가운데) ────────────────────────────────────────
//
// Stack의 두 자식 모두 layout(rect)에 셀 전체 영역이 전달되므로, 분모 자식은 자체적으로
// 하반부에 그린다(분자는 셀 상반부에 그리도록 Glyph의 align/baseline + height=TILE/2 활용).

interface TimeSigBottomHalfProps {
  glyph: string;
  fontSize: number;
}

class TimeSigBottomHalf implements W {
  private rect: Rect = { x: 0, y: 0, width: 0, height: 0 };

  constructor(private readonly props: TimeSigBottomHalfProps) {}

  measure(_c: Constraints): Size {
    return { width: PICKER_TILE_SIZE, height: PICKER_TILE_SIZE };
  }

  layout(rect: Rect): void {
    this.rect = rect;
  }

  paint(projector: Projector): void {
    const cx = this.rect.x + this.rect.width * 0.5;
    const cy = this.rect.y + this.rect.height * 0.75;
    projector.drawText(
      this.props.glyph,
      { x: cx, y: cy },
      {
        font: `${BRAVURA_FONT_FAMILY}, system-ui`,
        fontSize: this.props.fontSize,
        fill: PICKER_TEXT,
        align: 'center',
        baseline: 'middle',
      },
    );
  }

  hitTest(p: Point): string | null {
    return pointInRect(this.rect, p) ? null : null;
  }
}

// ─── 헬퍼 ─────────────────────────────────────────────────────────────────────

function drawGlyphAt(
  projector: Projector,
  glyph: string,
  x: number,
  y: number,
  fontSize: number,
  fill: Color,
  align: 'left' | 'center' | 'right',
  baseline: 'top' | 'middle' | 'bottom' | 'alphabetic',
): void {
  projector.drawText(
    glyph,
    { x, y },
    {
      font: `${BRAVURA_FONT_FAMILY}, system-ui`,
      fontSize,
      fill,
      align,
      baseline,
    },
  );
}

function clamp(v: number, lo: number, hi: number): number {
  if (hi < lo) return lo;
  return Math.max(lo, Math.min(hi, v));
}

function parseHoveredCellIndex(hoveredToken: string | null): number | null {
  if (!hoveredToken) return null;
  const prefix = `${PICKER_TOKEN_CELL_PREFIX}:`;
  if (!hoveredToken.startsWith(prefix)) return null;
  const n = Number(hoveredToken.slice(prefix.length));
  return Number.isFinite(n) ? n : null;
}

function parseHoveredId(hoveredToken: string | null, prefix: string): string | null {
  if (!hoveredToken) return null;
  const p = `${prefix}:`;
  if (!hoveredToken.startsWith(p)) return null;
  return hoveredToken.slice(p.length);
}
