import {
  getDrumPlayheadX,
  getProgressionPlayheadX,
  type ProgressionLayout,
} from '@oon/instrument-layouts';
import { getScorePlayhead, type ScorePlayheadPosition } from '@oon/score-engraving';
import type { SongLayout } from './types.js';

export interface SongRowPosition {
  x: number;
  y: number;
  height: number;
}

export interface SongPlayheadPositions {
  chord: SongRowPosition;
  score: (ScorePlayheadPosition & { y: number }) | null;
  drum?: SongRowPosition;
}

/**
 * 곡 시작부터 누적 beat를 받아 song 각 row의 절대 좌표(x, y)를 반환.
 * 각 row는 독립적으로 자신의 row y 오프셋을 더한 좌표를 가진다.
 */
export function getSongPlayhead(
  layout: SongLayout,
  beat: number,
  beatsPerBar: number,
): SongPlayheadPositions {
  const chordRowLayout: ProgressionLayout = {
    width: layout.width,
    height: layout.chordRow.height,
    cards: layout.chordRow.cards,
  };
  const chordX = getProgressionPlayheadX(chordRowLayout, beat, beatsPerBar);

  const scoreRaw = getScorePlayhead(layout.scoreRow.score, beat, beatsPerBar);
  const score: SongPlayheadPositions['score'] = scoreRaw
    ? {
        systemIndex: scoreRaw.systemIndex,
        x: scoreRaw.x,
        y: scoreRaw.y + layout.scoreRow.y,
        height: scoreRaw.height,
      }
    : null;

  const positions: SongPlayheadPositions = {
    chord: { x: chordX, y: layout.chordRow.y, height: layout.chordRow.height },
    score,
  };

  if (layout.drumRow) {
    const drumX = getDrumPlayheadX(layout.drumRow.drum, beat, beatsPerBar);
    positions.drum = { x: drumX, y: layout.drumRow.y, height: layout.drumRow.height };
  }

  return positions;
}
