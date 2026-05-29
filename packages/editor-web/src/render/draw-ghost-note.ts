import { BRAVURA_FONT_FAMILY, SMUFL, type GlyphName } from '@ooon/core';
import type { Projector } from '@ooon/shared';
import {
  GHOST_DOT_OFFSET_SP,
  GHOST_LEDGER_STROKE,
  GHOST_LEDGER_THICKNESS,
  GHOST_NOTE_FILL,
} from '../constants.js';

export interface DrawGhostNoteInput {
  /** 노트헤드/결합 글리프(noteheadBlack, noteQuarterUp, note8thUp 등). */
  glyph: GlyphName;
  /** 노트헤드 좌측 anchor x (score-renderer의 note.x와 동일 의미). */
  x: number;
  /** 노트헤드 중심 y (pitchAt의 snappedY 결과). */
  snappedY: number;
  /** 보표 한 칸의 픽셀 너비(= 1 staff space). fontSize/ledger 간격 기준. */
  lineGap: number;
  /** 보표 상단·하단 y. snappedY가 이 범위를 벗어나면 ledger line을 그린다. */
  staffTop: number;
  staffBottom: number;
  /** true면 노트헤드 우측 augmentationDot도 그린다(점음표 미리보기). */
  dotted: boolean;
}

// Ghost note preview 그리기.
//   - 노트헤드/결합 글리프를 회색 반투명으로 fillText.
//   - snappedY가 staff 위/아래에 있으면 lineGap 간격으로 ledger line 그림.
//   - dotted면 augmentationDot 글리프를 노트헤드 우측에 추가.
//
// 주의: SMuFL 결합 글리프(noteQuarterUp 등)의 anchor는 노트헤드 중심에 가깝다. drawText
// baseline='middle', align='left'로 두면 노트헤드의 좌측이 x, 수직 중심이 snappedY에 위치 —
// score-renderer의 renderNotehead와 동일한 anchor 약속이라 시각적으로 자연스럽다.
export function drawGhostNote(projector: Projector, input: DrawGhostNoteInput): void {
  const { glyph, x, snappedY, lineGap, staffTop, staffBottom, dotted } = input;

  // ledger line — staff 외부 한정. score-engraving의 ledgerLines 패스와 동일한 약속:
  //   상단 외부면 staff.top - lineGap에서 시작해 lineGap씩 위로, snappedY까지.
  //   하단 외부면 staff.bottom + lineGap에서 시작해 lineGap씩 아래로, snappedY까지.
  // ghost 용도라 노트헤드 좌우로 대략 lineGap*1.2씩 외연(엄밀한 SMUFL legerLineExtension 비율은
  // 시각 큐 수준에서 충분히 근사).
  const ledgerExtent = lineGap * 1.2;
  const ledgerX1 = x - ledgerExtent * 0.4;
  const ledgerX2 = x + ledgerExtent;
  if (snappedY < staffTop) {
    let y = staffTop - lineGap;
    while (y >= snappedY - lineGap * 0.5) {
      projector.drawLine(
        { x: ledgerX1, y },
        { x: ledgerX2, y },
        GHOST_LEDGER_STROKE,
        GHOST_LEDGER_THICKNESS,
      );
      y -= lineGap;
    }
  } else if (snappedY > staffBottom) {
    let y = staffBottom + lineGap;
    while (y <= snappedY + lineGap * 0.5) {
      projector.drawLine(
        { x: ledgerX1, y },
        { x: ledgerX2, y },
        GHOST_LEDGER_STROKE,
        GHOST_LEDGER_THICKNESS,
      );
      y += lineGap;
    }
  }

  const codepoint = SMUFL[glyph] as string;
  const fontSize = lineGap * 4;
  projector.drawText(
    codepoint,
    { x, y: snappedY },
    {
      font: `${BRAVURA_FONT_FAMILY}, system-ui`,
      fontSize,
      fill: GHOST_NOTE_FILL,
      baseline: 'middle',
      align: 'left',
    },
  );

  if (dotted) {
    projector.drawText(
      SMUFL.augmentationDot,
      { x: x + lineGap * GHOST_DOT_OFFSET_SP, y: snappedY },
      {
        font: `${BRAVURA_FONT_FAMILY}, system-ui`,
        fontSize,
        fill: GHOST_NOTE_FILL,
        baseline: 'middle',
        align: 'left',
      },
    );
  }
}
