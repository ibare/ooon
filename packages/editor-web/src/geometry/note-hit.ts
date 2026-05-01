import { BRAVURA_FONT_FAMILY, SMUFL } from '@oon/core';
import type { ScoreBarLayout, ScoreLayout, ScoreNoteLayout } from '@oon/score-engraving';

// SMuFL 글리프는 종류별로 anchor가 달라(노트헤드는 alphabetic baseline ≈ 헤드 중심,
// 쉼표 8/16분은 anchor가 글리프 윗부분) 단순히 (note.x, note.y) ± lineGap 으로 잡으면 어긋난다.
// 실제 글리프 boundingBox를 measureText로 얻어 hit rect를 정확히 산출하고,
// 음표는 헤드+stem+flag+dot의 합집합 박스로 확장한다(stem/flag도 클릭 가능하게).
//
// 클릭 정확도를 살짝 키우기 위해 글리프 박스에 가로 0.25 / 세로 0.15 lineGap 만큼 padding을 둔다.
const HIT_PAD_X_LINE_GAPS = 0.25;
const HIT_PAD_Y_LINE_GAPS = 0.15;
// score-renderer의 글리프 폰트 사이즈는 lineGap * 4 (sp 좌표가 px와 일치하는 배율).
const GLYPH_SIZE_PER_LINE_GAP = 4;

export interface NoteHitRect {
  systemIndex: number;
  /** ScoreNode.bars 내 인덱스 (0-based). barNumber - 1 변환. */
  barIndex: number;
  /** ScoreBar.notes 내 인덱스 (0-based). */
  noteIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

// 모듈 단일 offscreen canvas — 매 호출마다 새로 만들지 않도록 캐시.
// SSR 환경 대비 lazy 생성. document가 없으면 hit 계산은 휴리스틱(폴백).
let measureCtx: CanvasRenderingContext2D | null | undefined;
function getMeasureCtx(): CanvasRenderingContext2D | null {
  if (measureCtx !== undefined) return measureCtx;
  if (typeof document === 'undefined') {
    measureCtx = null;
    return null;
  }
  const c = document.createElement('canvas');
  measureCtx = c.getContext('2d');
  return measureCtx;
}

export function calculateNoteHits(layout: ScoreLayout): NoteHitRect[] {
  const ctx = getMeasureCtx();
  const out: NoteHitRect[] = [];
  for (const system of layout.systems) {
    const lineGap = system.staff.lineGap;
    const fontSize = lineGap * GLYPH_SIZE_PER_LINE_GAP;
    const padX = lineGap * HIT_PAD_X_LINE_GAPS;
    const padY = lineGap * HIT_PAD_Y_LINE_GAPS;
    if (ctx) {
      ctx.font = `${fontSize}px ${BRAVURA_FONT_FAMILY}, system-ui`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }
    for (const bar of system.bars) {
      const barIndex = bar.barNumber - 1;
      for (let i = 0; i < bar.notes.length; i++) {
        const note = bar.notes[i]!;
        const bounds = horizBounds(bar, i);
        const rect = ctx
          ? unionRectFromMeasure(ctx, note, padX, padY, bounds)
          : glyphRectFallback(note.x, note.y, lineGap, bounds);
        out.push({
          systemIndex: system.index,
          barIndex,
          noteIndex: note.noteIndex,
          ...rect,
        });
      }
    }
  }
  return out;
}

interface RectXYWH {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface HorizBounds {
  /** 좌측 클램프 한계(이 x 이하로 hit이 확장되지 않음). */
  left: number;
  /** 우측 클램프 한계. */
  right: number;
}

// 같은 마디 안에서 인접 음표 침범 방지용 좌우 한계.
// 인접 음표의 중간점, 없으면 마디 좌/우 경계(bar.x / bar.barlineX).
function horizBounds(bar: ScoreBarLayout, idx: number): HorizBounds {
  const cur = bar.notes[idx]!;
  const prev = bar.notes[idx - 1];
  const next = bar.notes[idx + 1];
  const left = prev ? (prev.x + cur.x) / 2 : bar.x;
  const right = next ? (cur.x + next.x) / 2 : bar.barlineX;
  return { left, right };
}

function unionRectFromMeasure(
  ctx: CanvasRenderingContext2D,
  note: ScoreNoteLayout,
  padX: number,
  padY: number,
  bounds: HorizBounds,
): RectXYWH {
  // 헤드부터 시작해 stem/flag/dot의 박스를 차례로 합친다.
  const headBox = measureGlyphBox(ctx, note.headGlyph, note.x, note.y);
  if (!headBox) return glyphRectFallback(note.x, note.y, padX * 4, bounds);

  let minX = headBox.minX;
  let maxX = headBox.maxX;
  let minY = headBox.minY;
  let maxY = headBox.maxY;

  if (note.stem) {
    // stem은 직선 — boundingBox는 자명. 두께는 무시(2px 미만).
    minX = Math.min(minX, note.stem.x);
    maxX = Math.max(maxX, note.stem.x);
    minY = Math.min(minY, note.stem.y1, note.stem.y2);
    maxY = Math.max(maxY, note.stem.y1, note.stem.y2);
  }
  if (note.flag) {
    const fb = measureGlyphBox(ctx, note.flag.glyph, note.flag.x, note.flag.y);
    if (fb) {
      minX = Math.min(minX, fb.minX);
      maxX = Math.max(maxX, fb.maxX);
      minY = Math.min(minY, fb.minY);
      maxY = Math.max(maxY, fb.maxY);
    }
  }
  for (const dot of note.dots) {
    const db = measureGlyphBox(ctx, SMUFL.augmentationDot, dot.x, dot.y);
    if (db) {
      minX = Math.min(minX, db.minX);
      maxX = Math.max(maxX, db.maxX);
      minY = Math.min(minY, db.minY);
      maxY = Math.max(maxY, db.maxY);
    }
  }

  // padding 적용 후 좌우 클램프(인접 음표 침범 방지).
  const x0 = Math.max(bounds.left, minX - padX);
  const x1 = Math.min(bounds.right, maxX + padX);
  const y0 = minY - padY;
  const y1 = maxY + padY;
  return { x: x0, y: y0, width: Math.max(0, x1 - x0), height: y1 - y0 };
}

interface GlyphBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

function measureGlyphBox(
  ctx: CanvasRenderingContext2D,
  glyph: string,
  anchorX: number,
  anchorY: number,
): GlyphBox | null {
  const m = ctx.measureText(glyph);
  const left = m.actualBoundingBoxLeft;
  const right = m.actualBoundingBoxRight;
  const ascent = m.actualBoundingBoxAscent;
  const descent = m.actualBoundingBoxDescent;
  if (!Number.isFinite(left) || ascent + descent <= 0) return null;
  return {
    minX: anchorX - left,
    maxX: anchorX + right,
    minY: anchorY - ascent,
    maxY: anchorY + descent,
  };
}

function glyphRectFallback(
  anchorX: number,
  anchorY: number,
  size: number,
  bounds: HorizBounds,
): RectXYWH {
  // 폰트가 안 잡힐 때 마지막 안전망 — 완전한 정확도는 포기하되 클릭은 가능하게.
  const x0 = Math.max(bounds.left, anchorX - size * 0.4);
  const x1 = Math.min(bounds.right, anchorX + size * 0.6);
  return { x: x0, y: anchorY - size / 2, width: Math.max(0, x1 - x0), height: size };
}

export function findNoteHitAt(
  hits: readonly NoteHitRect[],
  x: number,
  y: number,
): NoteHitRect | null {
  for (const r of hits) {
    if (x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height) return r;
  }
  return null;
}
