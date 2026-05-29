import type { Projector } from '@ooon/shared';
import { CanvasProjector } from '@ooon/projector-web';
import {
  BEAT_GROUP_GAP,
  BEAT_OVERLAY_BLINK_FILL,
  BEAT_OVERLAY_INNER_FILL,
  BEAT_OVERLAY_OUTER_FILL,
  BEAT_SLOT_INSET_EDGE,
  BEAT_SLOT_INSET_MID,
  BEAT_SLOT_INSET_Y,
} from '../constants.js';
import { groupBeatSlots, type BeatSlotRect } from '../geometry/beat-overlay.js';

export interface DrawOverlayOptions {
  /** "박자 느끼기" 트리거 시 강조할 슬롯의 글로벌 인덱스. */
  blinkSlot?: BeatSlotRect | null;
  /**
   * 다중 그룹(컴파운드/비대칭, 예: 6/8·9/8·5/4) 여부.
   * true: outer 그룹 박스 + inner 슬롯 박스 nesting + 첫·마지막 슬롯 EDGE inset.
   * false: outer 생략, 모든 슬롯 균일 MID inset (단순 박자 4/4·3/4·2/4 등).
   */
  useNesting?: boolean;
}

interface InnerRect {
  x: number;
  y: number;
  width: number;
  height: number;
  /** drawRect borderRadius 인자와 동일 의미. punch path와 fill path가 같은 모양이 되도록 매칭. */
  radius: number;
  /** fill 색상 — inner / hover / blink 중 하나. */
  fill: string;
}

const INNER_RADIUS = 3;

// 박자 오버레이는 색상 농도 nesting으로 큰박(그룹)과 작은박(슬롯)의 포함 관계를 시각화.
// outer = 그룹 union(연한 fill, 좌·우 GROUP_GAP/2씩 inset → 그룹 사이 갭),
// inner = 그룹 안에 inset된 슬롯(진한 fill, 첫·마지막은 EDGE inset, 중간은 MID inset).
// 둘 다 반투명이라 오선지가 비치는 것이 오버레이의 기본. 알파 누적으로 inner가 더 진해지는
// 문제는 outer를 inner 영역에서 destination-out으로 punch한 뒤 inner를 그려 회피한다.
// 단일 그룹 박자(예: 4/4 [4])는 nesting이 의미 없어 outer 생략 + 슬롯 균일 inset으로 단순화.
export function drawBeatOverlay(
  projector: Projector,
  slots: readonly BeatSlotRect[],
  opts: DrawOverlayOptions = {},
): void {
  const useNesting = opts.useNesting ?? false;
  const halfGap = BEAT_GROUP_GAP / 2;
  for (const g of groupBeatSlots(slots)) {
    const inners: InnerRect[] = g.members.map((slot, i) =>
      buildInnerRect(slot, i, g.members.length, useNesting, opts),
    );

    if (useNesting) {
      projector.drawRect(
        {
          x: g.x + halfGap,
          y: g.y,
          width: Math.max(0, g.width - halfGap * 2),
          height: g.height,
        },
        BEAT_OVERLAY_OUTER_FILL,
        undefined,
        0,
        4,
      );
      // outer 위에 inner를 그대로 그리면 알파가 누적되어 inner가 outer보다 더 진해진다.
      // 캔버스 백엔드에서는 destination-out으로 outer를 inner 영역에서 잘라낸 뒤 inner를 그려
      // 누적 없이 inner 알파만 보이도록 한다.
      punchInnerRegions(projector, inners);
    }

    for (const r of inners) {
      projector.drawRect(
        { x: r.x, y: r.y, width: r.width, height: r.height },
        r.fill,
        undefined,
        0,
        r.radius,
      );
    }
  }
}

function buildInnerRect(
  slot: BeatSlotRect,
  i: number,
  count: number,
  useNesting: boolean,
  opts: DrawOverlayOptions,
): InnerRect {
  const isFirst = i === 0;
  const isLast = i === count - 1;
  const leftInset = useNesting && isFirst ? BEAT_SLOT_INSET_EDGE : BEAT_SLOT_INSET_MID;
  const rightInset = useNesting && isLast ? BEAT_SLOT_INSET_EDGE : BEAT_SLOT_INSET_MID;
  return {
    x: slot.x + leftInset,
    y: slot.y + BEAT_SLOT_INSET_Y,
    width: Math.max(0, slot.width - leftInset - rightInset),
    height: Math.max(0, slot.height - BEAT_SLOT_INSET_Y * 2),
    radius: INNER_RADIUS,
    fill: pickInnerFill(slot, opts),
  };
}

// canvas escape hatch가 가능한 백엔드에서만 punch. 그 외 백엔드는 누적이 그대로 보이지만
// editor-web은 캔버스 전용이라 실사용 경로에선 문제 없음.
function punchInnerRegions(projector: Projector, inners: readonly InnerRect[]): void {
  if (!(projector instanceof CanvasProjector)) return;
  if (inners.length === 0) return;
  projector.withCanvas2D((ctx) => {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    for (const r of inners) {
      if (r.width <= 0 || r.height <= 0) continue;
      pathRoundedRect(ctx, r.x, r.y, r.width, r.height, Math.min(r.radius, r.width / 2, r.height / 2));
      ctx.fillStyle = '#000';
      ctx.fill();
    }
    ctx.restore();
  });
}

// CanvasProjector.pathRoundedRect와 동일한 quadraticCurveTo 모양. punch path와 fill path가
// 동일해야 antialiasing 잔여 픽셀 없이 깨끗하게 잘린다.
function pathRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  r: number,
): void {
  ctx.beginPath();
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

// blink 강조가 있으면 우선, 없으면 기본 inner fill. hover 강조는 ghost notehead가 대체.
function pickInnerFill(slot: BeatSlotRect, opts: DrawOverlayOptions): string {
  if (sameSlot(opts.blinkSlot ?? null, slot)) return BEAT_OVERLAY_BLINK_FILL;
  return BEAT_OVERLAY_INNER_FILL;
}

function sameSlot(a: BeatSlotRect | null, b: BeatSlotRect): boolean {
  if (!a) return false;
  return a.barIndex === b.barIndex && a.beatIndex === b.beatIndex;
}
