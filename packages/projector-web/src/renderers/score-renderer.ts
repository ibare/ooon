import type { Projector } from '@oon/shared';
import type { ScoreLayout } from '@oon/core';
import { FONT, METRICS, THEME } from '../theme.js';

export interface ScoreRenderOptions {
  originX?: number;
  originY?: number;
  showNoteNames?: boolean;
  bravuraFontSize?: number;
}

export function renderScore(
  projector: Projector,
  layout: ScoreLayout,
  opts: ScoreRenderOptions = {},
): void {
  const ox = opts.originX ?? 0;
  const oy = opts.originY ?? 0;
  const showNoteNames = opts.showNoteNames ?? false;
  const glyphSize = opts.bravuraFontSize ?? 28;

  projector.save();
  projector.translate(ox, oy);

  for (const y of layout.staff.lines) {
    projector.drawLine(
      { x: 10, y },
      { x: layout.width - 10, y },
      THEME.staffLine,
      METRICS.staffLineWidth,
    );
  }

  const glyphText = (size = glyphSize): {
    font: string;
    fontSize: number;
    fill: string;
    baseline: 'middle';
  } => ({
    font: FONT.bravura,
    fontSize: size,
    fill: THEME.foreground,
    baseline: 'middle',
  });

  projector.drawText(layout.clef.glyph, { x: layout.clef.x, y: layout.clef.y }, glyphText(44));

  projector.drawText(
    layout.timeSig.topGlyph,
    { x: layout.timeSig.x, y: layout.timeSig.topY },
    glyphText(26),
  );
  projector.drawText(
    layout.timeSig.bottomGlyph,
    { x: layout.timeSig.x, y: layout.timeSig.bottomY },
    glyphText(26),
  );

  for (const bar of layout.bars) {
    projector.drawLine(
      { x: bar.barlineX, y: layout.staff.top },
      { x: bar.barlineX, y: layout.staff.bottom },
      THEME.barline,
      METRICS.barlineWidth,
    );

    for (const note of bar.notes) {
      for (const ll of note.ledgerLines) {
        projector.drawLine(
          { x: ll.x1, y: ll.y },
          { x: ll.x2, y: ll.y },
          THEME.staffLine,
          METRICS.ledgerWidth,
        );
      }

      if (note.accidental) {
        projector.drawText(
          note.accidental.glyph,
          { x: note.accidental.x, y: note.accidental.y },
          glyphText(20),
        );
      }

      projector.drawText(note.headGlyph, { x: note.x, y: note.y }, glyphText(glyphSize));

      if (note.stem) {
        projector.drawLine(
          { x: note.stem.x, y: note.stem.y1 },
          { x: note.stem.x, y: note.stem.y2 },
          THEME.foreground,
          METRICS.stemWidth,
        );
      }
      if (note.flag) {
        projector.drawText(
          note.flag.glyph,
          { x: note.flag.x, y: note.flag.y },
          glyphText(glyphSize),
        );
      }
      for (const dot of note.dots) {
        projector.drawCircle({ x: dot.x, y: dot.y }, 1.8, THEME.foreground);
      }

      if (!note.isRest) {
        projector.registerHitArea(
          `score:${note.barNumber}:${note.noteIndex}`,
          { x: note.x - 8, y: note.y - 10, width: 20, height: 20 },
          'pointer',
        );
        if (showNoteNames) {
          projector.drawText(
            note.pitch,
            { x: note.x, y: layout.staff.bottom + 28 },
            { font: FONT.ui, fontSize: 10, fill: THEME.muted, align: 'center', baseline: 'top' },
          );
        }
      }
    }
  }

  projector.restore();
}
