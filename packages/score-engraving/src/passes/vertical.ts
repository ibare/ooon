import { ENGRAVING, GLYPHS } from '@ooon/smufl-asset';

// step: C0=0 기준의 7도 단계(letterStep). B4=4*7+6=34.
// 본 모듈은 SMuFL 메타데이터 단위(sp)에서 받은 값을 px로 변환해 반환한다.

export interface VerticalContext {
  centerY: number; // 보표 중앙선 y(px)
  staffTopY: number;
  staffBottomY: number;
  pxPerSp: number;
  b4Step: number; // letterStep('B', 4)
}

export interface LedgerLine {
  x1: number;
  x2: number;
  y: number;
}

// 음표 머리의 y(px). step이 한 단계 변하면 0.5 sp 이동.
export function noteY(step: number, ctx: VerticalContext): number {
  return ctx.centerY + (ctx.b4Step - step) * 0.5 * ctx.pxPerSp;
}

// 노트헤드 좌단 x를 받아, 보표 밖에서 필요한 ledger line들을 계산한다.
// ledger line 길이 = 노트헤드 폭 + 좌우로 legerLineExtension만큼 외연.
// headAdvanceSp 미지정 시 noteheadBlack 기준. whole/half는 호출자가 명시적으로 전달.
export function ledgerLines(
  noteCenterY: number,
  noteX: number,
  ctx: VerticalContext,
  headAdvanceSp: number = GLYPHS.noteheadBlack.advanceWidth,
): LedgerLine[] {
  const headWidthPx = headAdvanceSp * ctx.pxPerSp;
  const extentPx = ENGRAVING.legerLineExtension * ctx.pxPerSp;
  const x1 = noteX - extentPx;
  const x2 = noteX + headWidthPx + extentPx;

  const lines: LedgerLine[] = [];
  const halfPx = 0.5 * ctx.pxPerSp;
  if (noteCenterY < ctx.staffTopY) {
    let y = ctx.staffTopY - ctx.pxPerSp;
    while (y >= noteCenterY - halfPx) {
      lines.push({ x1, x2, y });
      y -= ctx.pxPerSp;
    }
  } else if (noteCenterY > ctx.staffBottomY) {
    let y = ctx.staffBottomY + ctx.pxPerSp;
    while (y <= noteCenterY + halfPx) {
      lines.push({ x1, x2, y });
      y += ctx.pxPerSp;
    }
  }
  return lines;
}
