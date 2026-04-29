import type { DrumNode, ProgressionNode, ScoreNode, SongNode } from '@oon/core';
import { calculateDrumLayout, calculateProgressionLayout } from '@oon/instrument-layouts';
import { calculateScoreLayout } from '@oon/score-engraving';
import type { SongLayout } from './types.js';

export interface SongLayoutOptions {
  width: number;
  chordHeight?: number;
  scoreStaffY?: number;
  drumTrackHeight?: number;
  gap?: number;
  minCardWidth?: number;
  minCellWidth?: number;
}

export function calculateSongLayout(node: SongNode, opts: SongLayoutOptions): SongLayout {
  const width = opts.width;
  const gap = opts.gap ?? 12;
  const chordHeight = opts.chordHeight ?? 80;

  const progressionAdapter: ProgressionNode = {
    type: 'progression',
    timeSignature: node.timeSignature,
    key: node.key,
    mode: 'major',
    bpm: node.bpm,
    bars: node.bars.map((b) => ({
      barNumber: b.barNumber,
      chords: [{ symbol: b.chord.symbol, notes: b.chord.notes, beats: b.chord.beats, root: '', quality: '' }],
    })),
    warnings: [],
  };

  const scoreAdapter: ScoreNode = {
    type: 'score',
    timeSignature: node.timeSignature,
    key: node.key,
    bpm: node.bpm,
    bars: node.bars.map((b) => ({ barNumber: b.barNumber, notes: [...b.melody] })),
    warnings: [],
  };

  const progressionLayout = calculateProgressionLayout(progressionAdapter, {
    width,
    cardHeight: chordHeight,
    gap: 0,
    minCardWidth: opts.minCardWidth ?? 80,
  });

  const chordRowY = 0;

  const scoreRowY = chordRowY + progressionLayout.height + gap;
  const scoreLayout = calculateScoreLayout(scoreAdapter, {
    width,
    ...(opts.scoreStaffY !== undefined ? { staffY: opts.scoreStaffY } : {}),
  });

  let drumLayout: ReturnType<typeof calculateDrumLayout> | undefined;
  let drumRowY = 0;
  if (node.beat && node.bars.some((b) => b.drum)) {
    const firstDrumBar = node.bars.find((b) => b.drum);
    const tracks = firstDrumBar?.drum ?? {};
    const resolution = Object.values(tracks)[0]?.length ?? 16;
    const drumAdapter: DrumNode = {
      type: 'drum',
      timeSignature: node.timeSignature,
      bpm: node.bpm,
      resolution,
      barCount: node.barCount,
      tracks: mergeDrumTracks(node),
      warnings: [],
    };
    drumLayout = calculateDrumLayout(drumAdapter, {
      width,
      minCellWidth: opts.minCellWidth ?? 6,
      ...(opts.drumTrackHeight !== undefined ? { trackHeight: opts.drumTrackHeight } : {}),
    });
    drumRowY = scoreRowY + scoreLayout.height + gap;
  }

  const totalHeight = drumLayout
    ? drumRowY + drumLayout.height
    : scoreRowY + scoreLayout.height;

  const totalWidth = Math.max(
    width,
    progressionLayout.width,
    scoreLayout.width,
    drumLayout?.width ?? 0,
  );

  const layout: SongLayout = {
    width: totalWidth,
    height: totalHeight,
    chordRow: {
      y: chordRowY,
      height: progressionLayout.height,
      cards: progressionLayout.cards,
    },
    scoreRow: { y: scoreRowY, height: scoreLayout.height, score: scoreLayout },
  };
  if (drumLayout) {
    layout.drumRow = { y: drumRowY, height: drumLayout.height, drum: drumLayout };
  }
  return layout;
}

function mergeDrumTracks(node: SongNode): DrumNode['tracks'] {
  const merged: Partial<Record<'HH' | 'SN' | 'KK' | 'TM' | 'CR' | 'RD', boolean[]>> = {};
  for (const bar of node.bars) {
    if (!bar.drum) continue;
    for (const [track, cells] of Object.entries(bar.drum)) {
      const k = track as 'HH' | 'SN' | 'KK' | 'TM' | 'CR' | 'RD';
      if (!merged[k]) merged[k] = [];
      if (cells) merged[k].push(...cells);
    }
  }
  return merged;
}
