// ─────────────────────────────────────────────────────────────────────────────
// 화음(chord) head 배치 — Behind Bars(Elaine Gould) 표준 정리.
//
// 본 모듈의 단일 책임:
//   1) outermost head 기반 stem 방향 결정 (chord 전체에 한 방향)
//   2) 인접 2도(step diff === 1)에서 head를 stem 반대편으로 shift
//   3) accidental 다중일 때 column 배치(좌측으로 packing)
//
// score-layout.ts와 spacing.ts가 이 헬퍼를 공유한다 — head shift / outermost 산출 로직은
// 본 파일이 단일 위치(rule-guard 권고).
// ─────────────────────────────────────────────────────────────────────────────

import type { AccidentalKind } from './accidentals.js';

export interface ChordPitchInfo {
  /** 화음 안 입력 순서. 호출자가 ScoreHeadLayout 결과를 NoteEvent.pitches와 동일 인덱스로 매핑할 때 사용. */
  index: number;
  /** letterStep(letter, octave) — vertical 위치 결정용. */
  step: number;
  accidental: AccidentalKind;
}

export type HeadSide = 'default' | 'shifted';

export interface PlacedHead {
  index: number;
  step: number;
  accidental: AccidentalKind;
  side: HeadSide;
  /** 좌→우 column 인덱스(0 = rightmost = 화음에 가장 가까움). accidental이 null이면 -1. */
  accidentalColumn: number;
}

export interface ChordPlacement {
  direction: 'up' | 'down';
  /** step 오름차순으로 정렬된 head 목록(원래 입력 인덱스 보존). */
  heads: PlacedHead[];
  /** 사용된 accidental column 수. 0이면 accidental 없음. */
  accidentalColumnCount: number;
  /** 화음에 shifted head가 한 개 이상 있는가. spacing 계산에 사용. */
  hasShiftedHead: boolean;
}

// outermost head로 stem 방향을 결정한다.
//   - b4Step에서 가장 멀리 떨어진 head가 결정한다(absolute distance 기준).
//   - 동률(예: 화음이 b4 양쪽으로 대칭)이면 down — single-note 컨벤션과 일치.
export function pickStemDirectionForChord(steps: readonly number[], b4Step: number): 'up' | 'down' {
  let bestDist = -1;
  let bestDir: 'up' | 'down' = 'down';
  for (const s of steps) {
    const diff = s - b4Step;
    const dist = Math.abs(diff);
    if (dist > bestDist) {
      bestDist = dist;
      bestDir = diff >= 0 ? 'down' : 'up';
    }
  }
  return bestDir;
}

// 화음 head 배치. step 오름차순 정렬 + 인접 2도에서 stem 반대편 shift.
//   - stem-up: 아래→위로 스캔. 직전 head가 default고 step diff === 1이면 현재 head를 shifted로.
//   - stem-down: 위→아래로 스캔. 직전 head가 default고 step diff === 1이면 현재 head를 shifted로.
// accidental column은 좌상→우하 순으로 그리디 배치(수직 거리 < ACCIDENTAL_VSEP_STEP이면 새 컬럼).
export function placeChord(
  pitches: readonly ChordPitchInfo[],
  b4Step: number,
): ChordPlacement {
  if (pitches.length === 0) {
    return { direction: 'down', heads: [], accidentalColumnCount: 0, hasShiftedHead: false };
  }
  const sorted = [...pitches].sort((a, b) => a.step - b.step);
  const direction = pickStemDirectionForChord(sorted.map((p) => p.step), b4Step);

  const sides: HeadSide[] = sorted.map(() => 'default');
  if (direction === 'up') {
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = sorted[i - 1]!;
      const cur = sorted[i]!;
      if (cur.step - prev.step === 1 && sides[i - 1] === 'default') {
        sides[i] = 'shifted';
      }
    }
  } else {
    for (let i = sorted.length - 2; i >= 0; i -= 1) {
      const cur = sorted[i]!;
      const above = sorted[i + 1]!;
      if (above.step - cur.step === 1 && sides[i + 1] === 'default') {
        sides[i] = 'shifted';
      }
    }
  }

  // accidental column 배치: 위→아래 순으로 처리. 같은 column에 들어가려면 직전 accidental과
  // 충분한 수직 거리(>= ACCIDENTAL_VSEP_STEP)가 있어야 한다. 없으면 좌측 새 column으로 push.
  const ACCIDENTAL_VSEP_STEP = 5; // ~2.5sp — 일반적인 accidental 글리프 높이
  const accidentalColumns: { lastStep: number }[] = [];
  // top→bottom == step 내림차순.
  const topToBottom = [...sorted]
    .map((p, i) => ({ p, originalIndex: i }))
    .filter(({ p }) => p.accidental !== null)
    .sort((a, b) => b.p.step - a.p.step);
  const columnByOriginalIdx = new Map<number, number>();
  for (const { p, originalIndex } of topToBottom) {
    let placed = -1;
    for (let c = 0; c < accidentalColumns.length; c += 1) {
      const col = accidentalColumns[c]!;
      if (col.lastStep - p.step >= ACCIDENTAL_VSEP_STEP) {
        col.lastStep = p.step;
        placed = c;
        break;
      }
    }
    if (placed === -1) {
      accidentalColumns.push({ lastStep: p.step });
      placed = accidentalColumns.length - 1;
    }
    columnByOriginalIdx.set(originalIndex, placed);
  }

  const heads: PlacedHead[] = sorted.map((p, i) => ({
    index: p.index,
    step: p.step,
    accidental: p.accidental,
    side: sides[i]!,
    accidentalColumn: columnByOriginalIdx.get(i) ?? -1,
  }));

  return {
    direction,
    heads,
    accidentalColumnCount: accidentalColumns.length,
    hasShiftedHead: sides.some((s) => s === 'shifted'),
  };
}
