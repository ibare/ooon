import type { Projector, TextOptions } from '@oon/shared';
import { SMUFL } from '@oon/core';
import type {
  ScoreBarLayout,
  ScoreGlyph,
  ScoreLayout,
  ScoreNoteLayout,
  ScoreStaff,
  ScoreSystemLayout,
  ScoreTimeSig,
} from '@oon/score-engraving';
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
  renderLedgerLines(projector, note);
  renderAccidental(projector, note, ctx.glyphSize);
  renderNotehead(projector, note, ctx.glyphSize);
  renderStem(projector, note);
  renderFlag(projector, note, ctx.glyphSize);
  renderDots(projector, note, ctx.glyphSize);

  if (!note.isRest) {
    registerNoteHitArea(projector, note);
    if (ctx.showNoteNames) {
      renderNoteName(projector, note, ctx.staffBottom);
    }
  }
}

function renderLedgerLines(projector: Projector, note: ScoreNoteLayout): void {
  for (const ll of note.ledgerLines) {
    projector.drawLine(
      { x: ll.x1, y: ll.y },
      { x: ll.x2, y: ll.y },
      THEME.staffLine,
      METRICS.ledgerWidth,
    );
  }
}

function renderAccidental(projector: Projector, note: ScoreNoteLayout, glyphSize: number): void {
  if (!note.accidental) return;
  projector.drawText(
    note.accidental.glyph,
    { x: note.accidental.x, y: note.accidental.y },
    bravuraStyle(glyphSize),
  );
}

function renderNotehead(projector: Projector, note: ScoreNoteLayout, glyphSize: number): void {
  projector.drawText(note.headGlyph, { x: note.x, y: note.y }, bravuraStyle(glyphSize));
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
  projector.registerHitArea(
    `score:${note.barNumber}:${note.noteIndex}`,
    {
      x: note.x - HIT_OFFSET_X,
      y: note.y - HIT_OFFSET_Y,
      width: HIT_WIDTH,
      height: HIT_HEIGHT,
    },
    'pointer',
  );
}

function renderNoteName(projector: Projector, note: ScoreNoteLayout, staffBottom: number): void {
  projector.drawText(
    note.pitch,
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
