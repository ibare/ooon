import type { LayoutBase } from '@oon/core';
import type { DrumLayout, ProgressionCardLayout } from '@oon/instrument-layouts';
import type { ScoreLayout } from '@oon/score-engraving';

export interface SongLayout extends LayoutBase {
  chordRow: { y: number; height: number; cards: ProgressionCardLayout[] };
  scoreRow: { y: number; height: number; score: ScoreLayout };
  drumRow?: { y: number; height: number; drum: DrumLayout };
}
