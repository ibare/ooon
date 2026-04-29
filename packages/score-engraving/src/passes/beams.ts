import type { NoteEvent, TimeSignature } from '@oon/core';

// ─────────────────────────────────────────────────────────────────────────────
// P3: auto-beaming 그룹화
// 박 경계(정수 beat) 안에서 인접한 동일 음가의 짧은 음표를 묶는다.
// 본 단계 단순화: 그룹 안 음가가 동일할 때만 빔. 혼합 음가는 단독 처리.
// ─────────────────────────────────────────────────────────────────────────────

const EPSILON = 1e-6;

// 빔 가능한 음가별 빔 줄 수. 점 8분(0.75)은 1줄, 점 16분(0.375)은 2줄.
function beamCountOf(beats: number): number | null {
  if (Math.abs(beats - 0.5) < EPSILON) return 1;
  if (Math.abs(beats - 0.75) < EPSILON) return 1;
  if (Math.abs(beats - 0.25) < EPSILON) return 2;
  if (Math.abs(beats - 0.375) < EPSILON) return 2;
  return null;
}

export interface BeamGroup {
  // bar.notes 인덱스
  noteIndices: number[];
  // 빔 줄 수 (1=8분, 2=16분)
  beamCount: number;
}

// 그룹화 결과. 그룹에 속하지 않은 음표는 별도 표기 없음(호출자가 인덱스 차집합으로 단독 처리).
export function groupBeams(
  notes: readonly NoteEvent[],
  _timeSignature: TimeSignature,
): BeamGroup[] {
  const groups: BeamGroup[] = [];
  let cursor = 0; // 누적 beat 위치
  let i = 0;
  while (i < notes.length) {
    const n = notes[i];
    if (!n) {
      i += 1;
      continue;
    }
    const startBeat = cursor;
    const count = beamCountOf(n.beats);
    // 빔 가능한 음표가 아니거나, 시작 위치가 정수 beat 경계가 아니면 단독 처리.
    if (n.isRest || count === null || !isAtBeatBoundary(startBeat)) {
      cursor += n.beats;
      i += 1;
      continue;
    }

    // 같은 박 안에서 동일 음가가 이어지는 동안 묶는다.
    const indices: number[] = [i];
    const beatsPerNote = n.beats;
    const nextBeatBoundary = Math.floor(startBeat) + 1;
    let groupCursor = startBeat + n.beats;
    let j = i + 1;
    while (j < notes.length) {
      const m = notes[j];
      if (!m) break;
      if (m.isRest) break;
      if (Math.abs(m.beats - beatsPerNote) > EPSILON) break;
      if (groupCursor + m.beats - nextBeatBoundary > EPSILON) break;
      indices.push(j);
      groupCursor += m.beats;
      j += 1;
    }

    if (indices.length >= 2) {
      groups.push({ noteIndices: indices, beamCount: count });
    }
    cursor = groupCursor;
    i = j;
  }
  return groups;
}

function isAtBeatBoundary(beat: number): boolean {
  return Math.abs(beat - Math.round(beat)) < EPSILON;
}
