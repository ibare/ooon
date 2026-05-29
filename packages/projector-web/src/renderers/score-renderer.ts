import type { Projector, TextOptions } from '@ooon/shared';
import { SMUFL } from '@ooon/core';
import type {
  ScoreBarLayout,
  ScoreGlyph,
  ScoreLayout,
  ScoreNoteLayout,
  ScoreStaff,
  ScoreSystemLayout,
  ScoreTimeSig,
} from '@ooon/score-engraving';
import { FONT, METRICS, THEME } from '../theme.js';

export interface ScoreRenderOptions {
  originX?: number;
  originY?: number;
  showNoteNames?: boolean;
  // Bravura em-square를 4 sp(=lineGap*4)로 두는 기본값을 override.
  // 미지정 시 systems[0].staff.lineGap * 4 사용 — 이 값이 SMuFL 좌표와 픽셀 좌표를 일치시킨다.
  bravuraFontSize?: number;
}

interface NoteRenderCtx {
  glyphSize: number;
  staffBottom: number;
  showNoteNames: boolean;
}

const STAFF_LEFT_PAD = 10;
const STAFF_RIGHT_PAD = 10;
const NOTE_NAME_GLYPH_SIZE = 10;
const NOTE_NAME_OFFSET_Y = 28;
const HIT_OFFSET_X = 8;
const HIT_OFFSET_Y = 10;
const HIT_WIDTH = 20;
const HIT_HEIGHT = 20;

export function renderScore(
  projector: Projector,
  layout: ScoreLayout,
  opts: ScoreRenderOptions = {},
): void {
  const ox = opts.originX ?? 0;
  const oy = opts.originY ?? 0;
  const firstStaff = layout.systems[0]?.staff;
  // SMuFL 규약상 Bravura의 em-square = 4 sp. staff.lineGap이 곧 1 sp의 px 크기이므로
  // fontSize = lineGap * 4 일 때 글리프 좌표(sp)가 픽셀 좌표와 정확히 일치한다.
  const glyphSize = opts.bravuraFontSize ?? (firstStaff ? firstStaff.lineGap * 4 : 40);
  const showNoteNames = opts.showNoteNames ?? false;

  projector.save();
  projector.translate(ox, oy);

  for (const system of layout.systems) {
    renderSystem(projector, layout, system, glyphSize, showNoteNames);
  }

  projector.restore();
}

function renderSystem(
  projector: Projector,
  layout: ScoreLayout,
  system: ScoreSystemLayout,
  glyphSize: number,
  showNoteNames: boolean,
): void {
  renderStaffLines(projector, layout, system.staff);
  renderClef(projector, system.clef, glyphSize);
  renderKeySig(projector, system.keySig, glyphSize);
  renderTimeSig(projector, system.timeSig, glyphSize);

  const noteCtx: NoteRenderCtx = {
    glyphSize,
    staffBottom: system.staff.bottom,
    showNoteNames,
  };

  for (const bar of system.bars) {
    renderBarline(projector, bar, system.staff);
    for (const note of bar.notes) {
      renderNote(projector, note, noteCtx);
    }
    renderBeams(projector, bar);
  }
}

function bravuraStyle(fontSize: number): TextOptions {
  return {
    font: FONT.bravura,
    fontSize,
    fill: THEME.foreground,
    baseline: 'middle',
  };
}

function renderStaffLines(projector: Projector, layout: ScoreLayout, staff: ScoreStaff): void {
  const x1 = STAFF_LEFT_PAD;
  const x2 = layout.width - STAFF_RIGHT_PAD;
  for (const y of staff.lines) {
    projector.drawLine({ x: x1, y }, { x: x2, y }, THEME.staffLine, METRICS.staffLineWidth);
  }
}

function renderClef(projector: Projector, clef: ScoreGlyph, glyphSize: number): void {
  projector.drawText(clef.glyph, { x: clef.x, y: clef.y }, bravuraStyle(glyphSize));
}

function renderKeySig(
  projector: Projector,
  keySig: readonly ScoreGlyph[],
  glyphSize: number,
): void {
  const style = bravuraStyle(glyphSize);
  for (const g of keySig) {
    projector.drawText(g.glyph, { x: g.x, y: g.y }, style);
  }
}

function renderTimeSig(projector: Projector, timeSig: ScoreTimeSig, glyphSize: number): void {
  // 분자/분모는 자릿수가 달라도(예: 12/8) 같은 cx 기준으로 가운데 정렬되어야 한다.
  const style = { ...bravuraStyle(glyphSize), align: 'center' as const };
  projector.drawText(timeSig.topGlyph, { x: timeSig.cx, y: timeSig.topY }, style);
  projector.drawText(timeSig.bottomGlyph, { x: timeSig.cx, y: timeSig.bottomY }, style);
}

function renderBarline(projector: Projector, bar: ScoreBarLayout, staff: ScoreStaff): void {
  projector.drawLine(
    { x: bar.barlineX, y: staff.top },
    { x: bar.barlineX, y: staff.bottom },
    THEME.barline,
    METRICS.barlineWidth,
  );
}

function renderNote(projector: Projector, note: ScoreNoteLayout, ctx: NoteRenderCtx): void {
  if (note.isRest) {
    renderRest(projector, note, ctx.glyphSize);
    renderDots(projector, note, ctx.glyphSize);
    return;
  }
  // 화음 1급: ledger lines / accidental / notehead는 head별, stem/flag/dots는 화음 전체.
  for (const head of note.heads) {
    renderHeadLedgerLines(projector, head);
  }
  for (const head of note.heads) {
    renderHeadAccidental(projector, head, ctx.glyphSize);
  }
  for (const head of note.heads) {
    renderHeadNotehead(projector, note, head, ctx.glyphSize);
  }
  renderStem(projector, note);
  renderFlag(projector, note, ctx.glyphSize);
  renderDots(projector, note, ctx.glyphSize);

  registerNoteHitArea(projector, note);
  if (ctx.showNoteNames) {
    renderNoteName(projector, note, ctx.staffBottom);
  }
}

function renderRest(projector: Projector, note: ScoreNoteLayout, glyphSize: number): void {
  if (note.restGlyph === undefined || note.restY === undefined) return;
  projector.drawText(note.restGlyph, { x: note.x, y: note.restY }, bravuraStyle(glyphSize));
}

function renderHeadLedgerLines(
  projector: Projector,
  head: ScoreNoteLayout['heads'][number],
): void {
  for (const ll of head.ledgerLines) {
    projector.drawLine(
      { x: ll.x1, y: ll.y },
      { x: ll.x2, y: ll.y },
      THEME.staffLine,
      METRICS.ledgerWidth,
    );
  }
}

function renderHeadAccidental(
  projector: Projector,
  head: ScoreNoteLayout['heads'][number],
  glyphSize: number,
): void {
  if (!head.accidental) return;
  projector.drawText(
    head.accidental.glyph,
    { x: head.accidental.x, y: head.accidental.y },
    bravuraStyle(glyphSize),
  );
}

function renderHeadNotehead(
  projector: Projector,
  note: ScoreNoteLayout,
  head: ScoreNoteLayout['heads'][number],
  glyphSize: number,
): void {
  projector.drawText(
    head.headGlyph,
    { x: note.x + head.xOffset, y: head.y },
    bravuraStyle(glyphSize),
  );
}

function renderStem(projector: Projector, note: ScoreNoteLayout): void {
  if (!note.stem) return;
  projector.drawLine(
    { x: note.stem.x, y: note.stem.y1 },
    { x: note.stem.x, y: note.stem.y2 },
    THEME.foreground,
    METRICS.stemWidth,
  );
}

function renderFlag(projector: Projector, note: ScoreNoteLayout, glyphSize: number): void {
  if (!note.flag) return;
  projector.drawText(
    note.flag.glyph,
    { x: note.flag.x, y: note.flag.y },
    bravuraStyle(glyphSize),
  );
}

function renderDots(projector: Projector, note: ScoreNoteLayout, glyphSize: number): void {
  if (note.dots.length === 0) return;
  const style = bravuraStyle(glyphSize);
  for (const dot of note.dots) {
    projector.drawText(SMUFL.augmentationDot, { x: dot.x, y: dot.y }, style);
  }
}

function registerNoteHitArea(projector: Projector, note: ScoreNoteLayout): void {
  // hit area는 noteIndex 단위 union — 화음 head 전체를 덮는 하나의 영역.
  // head별 hit는 후속 PR에서 추가한다(현 단계는 클릭/replace 흐름이 noteIndex 기준).
  if (note.heads.length === 0) return;
  let minY = Infinity;
  let maxY = -Infinity;
  let minX = Infinity;
  let maxX = -Infinity;
  for (const head of note.heads) {
    if (head.y < minY) minY = head.y;
    if (head.y > maxY) maxY = head.y;
    const headX = note.x + head.xOffset;
    if (headX < minX) minX = headX;
    if (headX > maxX) maxX = headX;
  }
  projector.registerHitArea(
    `score:${note.barNumber}:${note.noteIndex}`,
    {
      x: minX - HIT_OFFSET_X,
      y: minY - HIT_OFFSET_Y,
      width: maxX - minX + HIT_WIDTH,
      height: maxY - minY + HIT_HEIGHT,
    },
    'pointer',
  );
}

function renderNoteName(projector: Projector, note: ScoreNoteLayout, staffBottom: number): void {
  // 화음은 첫 head의 pitch만 표시(상세 편집은 후속 UX). 단음은 그대로 동작.
  const first = note.heads[0];
  if (!first) return;
  projector.drawText(
    first.pitch,
    { x: note.x, y: staffBottom + NOTE_NAME_OFFSET_Y },
    {
      font: FONT.ui,
      fontSize: NOTE_NAME_GLYPH_SIZE,
      fill: THEME.muted,
      align: 'center',
      baseline: 'top',
    },
  );
}

function renderBeams(projector: Projector, bar: ScoreBarLayout): void {
  for (const beam of bar.beams) {
    for (const line of beam.lines) {
      projector.drawLine(
        { x: line.x1, y: line.y },
        { x: line.x2, y: line.y },
        THEME.foreground,
        line.thickness,
      );
    }
  }
}
