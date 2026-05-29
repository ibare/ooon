import type { Projector } from '@ooon/shared';
import { getSongPlayhead, type SongLayout } from '@ooon/composition';
import { CanvasProjector } from '../canvas-projector.js';

export interface SongPlayheadOverlayOptions {
  originX?: number;
  originY?: number;
  /** 플레이헤드 점선 색. 미지정 시 사양값(앰버)을 사용. */
  color?: string;
  /** 플레이헤드 라인 두께. */
  width?: number;
  /** 현재 마디 배경 색. */
  barBgColor?: string;
}

const DEFAULT_COLOR = 'rgba(154,107,40,0.45)';
const DEFAULT_WIDTH = 1.5;
const DEFAULT_BAR_BG = 'rgba(154,107,40,0.025)';

/**
 * Song layout 위에 현재 마디 배경 + 코드~드럼을 통과하는 단일 수직 점선을 그린다.
 * - 배경은 활성 마디의 X/너비를 score system bars에서 가져와 코드 영역 상단 ~ 드럼 영역 하단 전체를 덮는다.
 * - 라인은 한 system 내 progression top ~ drum bottom을 통과(없으면 score만 통과).
 * - CanvasProjector이면 점선(`setLineDash([4,3])`), 그 외 백엔드에서는 단순 drawLine으로 폴백.
 */
export function drawSongPlayheadOverlay(
  projector: Projector,
  layout: SongLayout,
  beat: number,
  beatsPerBar: number,
  opts: SongPlayheadOverlayOptions = {},
): void {
  const ox = opts.originX ?? 0;
  const oy = opts.originY ?? 0;
  const color = opts.color ?? DEFAULT_COLOR;
  const lineWidth = opts.width ?? DEFAULT_WIDTH;
  const barBg = opts.barBgColor ?? DEFAULT_BAR_BG;

  const pos = getSongPlayhead(layout, beat, beatsPerBar);
  if (pos.systemIndex < 0) return;
  const sys = layout.systems[pos.systemIndex];
  if (!sys) return;

  const top =
    pos.chord?.y ??
    pos.score?.y ??
    pos.drum?.y ??
    sys.y;
  const bottom =
    (pos.drum ? pos.drum.y + pos.drum.height : undefined) ??
    (pos.score ? pos.score.y + pos.score.height : undefined) ??
    (pos.chord ? pos.chord.y + pos.chord.height : sys.y + sys.height);

  // 활성 마디의 X/너비 — score system bars에서 현재 beat가 속한 마디를 찾아 사용.
  const activeBar = findActiveBar(sys, beat, beatsPerBar);
  if (activeBar) {
    drawBarBackground(projector, ox + activeBar.x, oy + top, activeBar.width, bottom - top, barBg);
  }

  const lineX = pos.chord?.x ?? pos.score?.x ?? pos.drum?.x;
  if (lineX === undefined) return;

  drawDashedLine(projector, ox + lineX, oy + top, oy + bottom, color, lineWidth);
}

function findActiveBar(
  sys: SongLayout['systems'][number],
  beat: number,
  beatsPerBar: number,
): { x: number; width: number } | undefined {
  // score system 0의 bars는 절대 barNumber를 보존하므로 그것으로 인덱싱.
  const sysScore = sys.score.layout.systems[0];
  if (!sysScore) return undefined;
  const firstBarNum = sysScore.bars[0]?.barNumber ?? 1;
  const beatInSys = Math.max(0, beat - (firstBarNum - 1) * beatsPerBar);
  const barIdxInSys = Math.min(
    sysScore.bars.length - 1,
    Math.floor(beatInSys / beatsPerBar),
  );
  const bar = sysScore.bars[barIdxInSys];
  if (!bar) return undefined;
  return { x: bar.x, width: bar.width };
}

function drawBarBackground(
  projector: Projector,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): void {
  if (w <= 0 || h <= 0) return;
  if (projector instanceof CanvasProjector) {
    projector.withCanvas2D((ctx) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
    });
  } else {
    projector.drawRect({ x, y, width: w, height: h }, color);
  }
}

function drawDashedLine(
  projector: Projector,
  x: number,
  y1: number,
  y2: number,
  color: string,
  lineWidth: number,
): void {
  if (projector instanceof CanvasProjector) {
    projector.withCanvas2D((ctx) => {
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(x, y1);
      ctx.lineTo(x, y2);
      ctx.stroke();
      ctx.restore();
    });
  } else {
    projector.drawLine({ x, y: y1 }, { x, y: y2 }, color, lineWidth);
  }
}
