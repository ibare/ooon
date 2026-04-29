import { pitchToMidi, type SongNode } from '@oon/core';
import {
  getDrumPlayheadX,
  getProgressionPlayheadX,
  type ProgressionLayout,
} from '@oon/instrument-layouts';
import { getScorePlayhead, type ScorePlayheadPosition } from '@oon/score-engraving';
import type { SongLayout, SongSystemRow } from './types.js';
import { chooseChordVoicingMidis } from './voicing.js';

export interface SongRowPosition {
  x: number;
  y: number;
  height: number;
}

export interface SongPlayheadPositions {
  /** 활성 system index. song에 system이 없으면 -1. */
  systemIndex: number;
  chord?: SongRowPosition;
  score?: ScorePlayheadPosition & { y: number };
  drum?: SongRowPosition;
}

/**
 * 곡 시작부터 누적 beat를 받아 활성 system을 찾고 그 system 안에서 각 row의 절대 좌표를 반환.
 * - 한 system이 N개 마디를 담을 때 그 system은 [N*beatsPerBar) beat 범위를 차지.
 * - 곡 범위 밖 beat는 곡 시작/끝으로 클램프.
 */
export function getSongPlayhead(
  layout: SongLayout,
  beat: number,
  beatsPerBar: number,
): SongPlayheadPositions {
  if (layout.systems.length === 0) {
    return { systemIndex: -1 };
  }

  // 각 system의 마디 수에 따른 누적 beat 범위 계산
  let beatStart = 0;
  let activeIdx = 0;
  let beatInSystem = 0;
  for (let i = 0; i < layout.systems.length; i += 1) {
    const sys = layout.systems[i]!;
    const barsInSys = countSystemBars(sys);
    const beatSpan = barsInSys * beatsPerBar;
    if (beat < beatStart + beatSpan || i === layout.systems.length - 1) {
      activeIdx = i;
      beatInSystem = Math.max(0, Math.min(beatSpan, beat - beatStart));
      break;
    }
    beatStart += beatSpan;
  }

  const sys = layout.systems[activeIdx]!;
  const positions: SongPlayheadPositions = { systemIndex: activeIdx };

  if (sys.progression) {
    const progLayout: ProgressionLayout = {
      width: 0,
      height: sys.progression.height,
      cards: sys.progression.cards,
    };
    const x = getProgressionPlayheadX(progLayout, beatInSystem, beatsPerBar);
    positions.chord = {
      x,
      y: sys.y + sys.progression.y,
      height: sys.progression.height,
    };
  }

  const scoreRaw = getScorePlayhead(sys.score.layout, beatInSystem, beatsPerBar);
  if (scoreRaw) {
    positions.score = {
      systemIndex: scoreRaw.systemIndex,
      x: scoreRaw.x,
      y: scoreRaw.y + sys.y + sys.score.y,
      height: scoreRaw.height,
    };
  }

  if (sys.drum) {
    const drumX = getDrumPlayheadX(sys.drum.layout, beatInSystem, beatsPerBar);
    positions.drum = {
      x: drumX,
      y: sys.y + sys.drum.y,
      height: sys.drum.height,
    };
  }

  return positions;
}

function countSystemBars(sys: SongSystemRow): number {
  return sys.score.layout.systems[0]?.bars.length ?? 0;
}

export interface SongActiveNotes {
  /** 현재 beat가 속한 melody 노트의 MIDI. rest거나 미상이면 null. */
  melodyMidi: number | null;
  /** 현재 마디 chord의 고정 옥타브(C3..B3) root-position voicing MIDI 배열. */
  chordMidis: number[];
}

/**
 * 누적 beat에 해당하는 마디의 chord voicing MIDI와 melody 단일 노트 MIDI를 산출한다.
 * - chord 보이싱은 chooseChordVoicingMidis(고정 옥타브 root-position) 정책을 따른다.
 * - 곡 범위 밖 beat는 첫/마지막 마디로 클램프.
 * - melody는 마디 내에서 beat가 [start, start+beats) 범위에 들어가는 노트를 활성으로 본다.
 */
export function getSongActiveNotes(
  node: SongNode,
  beat: number,
  beatsPerBar: number,
): SongActiveNotes {
  if (node.bars.length === 0) {
    return { melodyMidi: null, chordMidis: [] };
  }

  const totalBeats = node.bars.length * beatsPerBar;
  const clamped = Math.max(0, Math.min(totalBeats - 1e-6, beat));
  const barIdx = Math.min(node.bars.length - 1, Math.floor(clamped / beatsPerBar));
  const bar = node.bars[barIdx]!;
  const beatInBar = clamped - barIdx * beatsPerBar;

  // 활성 melody 노트
  let melodyMidi: number | null = null;
  let cursor = 0;
  for (const ev of bar.melody) {
    const next = cursor + ev.beats;
    if (beatInBar >= cursor && beatInBar < next) {
      if (!ev.isRest && ev.pitch) {
        try {
          melodyMidi = pitchToMidi(ev.pitch);
        } catch {
          melodyMidi = null;
        }
      }
      break;
    }
    cursor = next;
  }

  return { melodyMidi, chordMidis: chooseChordVoicingMidis(bar.chord) };
}
