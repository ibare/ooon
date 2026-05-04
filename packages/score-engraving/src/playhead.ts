import { pitchToMidi, type ScoreNode } from '@oon/core';
import type { ScoreLayout } from './types.js';

export interface ScorePlayheadPosition {
  systemIndex: number;
  x: number;
  y: number;
  height: number;
}

/**
 * 곡 시작부터 누적된 beat(timeSignature 기반) 위치를 받아
 * 해당 beat가 속한 system의 좌표를 반환한다.
 *
 * - layout.systems가 비어 있으면 null.
 * - beat가 곡 범위 이전이면 첫 시스템 첫 마디 시작에 클램프.
 * - beat가 곡 범위 이후이면 마지막 시스템 마지막 마디 끝에 클램프.
 */
export function getScorePlayhead(
  layout: ScoreLayout,
  beat: number,
  beatsPerBar: number,
): ScorePlayheadPosition | null {
  if (layout.systems.length === 0) return null;

  const targetBarNumber = Math.floor(beat / beatsPerBar) + 1; // bar.barNumber는 1-based

  for (let si = 0; si < layout.systems.length; si += 1) {
    const sys = layout.systems[si]!;
    if (sys.bars.length === 0) continue;
    const first = sys.bars[0]!.barNumber;
    const last = sys.bars[sys.bars.length - 1]!.barNumber;

    if (targetBarNumber < first) {
      const bar = sys.bars[0]!;
      return { systemIndex: si, x: bar.x, y: sys.y, height: sys.height };
    }
    if (targetBarNumber > last) continue;

    const bar = sys.bars[targetBarNumber - first]!;
    const beatInBar = beat - (targetBarNumber - 1) * beatsPerBar;
    const t = Math.max(0, Math.min(1, beatInBar / beatsPerBar));
    return { systemIndex: si, x: bar.x + t * bar.width, y: sys.y, height: sys.height };
  }

  for (let si = layout.systems.length - 1; si >= 0; si -= 1) {
    const sys = layout.systems[si]!;
    if (sys.bars.length === 0) continue;
    const lastBar = sys.bars[sys.bars.length - 1]!;
    return { systemIndex: si, x: lastBar.x + lastBar.width, y: sys.y, height: sys.height };
  }
  return null;
}

export interface ScoreActiveNotes {
  /** 활성 NoteEvent의 최상성 MIDI(rest거나 미상이면 null). 키보드 melody 강조에 사용. */
  melodyMidi: number | null;
  /** 활성 NoteEvent의 모든 pitch MIDI. 단음/다중음 모두 채운다. 키보드 chord 강조에 사용. */
  chordMidis: number[];
  /** Score는 chord 의미가 없으므로 항상 null. SongActiveNotes와 형태를 맞추기 위한 자리. */
  rootMidi: null;
}

const EMPTY_ACTIVE: ScoreActiveNotes = { melodyMidi: null, chordMidis: [], rootMidi: null };

/**
 * 곡 시작부터 누적된 beat에 활성인 NoteEvent의 MIDI 집합을 반환한다.
 * - 곡 범위 밖이거나 활성 이벤트가 rest면 빈 결과.
 * - 다중 pitch는 chordMidis 전체에 담고, 그 중 최상성을 melodyMidi로도 노출.
 * - rootMidi는 항상 null(score는 chord root 개념 없음).
 */
export function getScoreActiveNotes(
  node: ScoreNode,
  beat: number,
  beatsPerBar: number,
): ScoreActiveNotes {
  if (node.bars.length === 0) return EMPTY_ACTIVE;

  const totalBeats = node.bars.length * beatsPerBar;
  if (beat < 0 || beat >= totalBeats) return EMPTY_ACTIVE;

  const barIdx = Math.min(node.bars.length - 1, Math.floor(beat / beatsPerBar));
  const bar = node.bars[barIdx]!;
  const beatInBar = beat - barIdx * beatsPerBar;

  let cursor = 0;
  for (const ev of bar.notes) {
    const next = cursor + ev.beats;
    if (beatInBar >= cursor && beatInBar < next) {
      if (ev.isRest || ev.pitches.length === 0) return EMPTY_ACTIVE;
      const midis: number[] = [];
      let topMidi: number | null = null;
      for (const p of ev.pitches) {
        const m = pitchToMidi(p);
        midis.push(m);
        if (topMidi === null || m > topMidi) topMidi = m;
      }
      return { melodyMidi: topMidi, chordMidis: midis, rootMidi: null };
    }
    cursor = next;
  }
  return EMPTY_ACTIVE;
}
