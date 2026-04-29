import type { LayoutBase } from '@oon/core';
import type {
  DrumLayout,
  KeyboardLayout,
  ProgressionCardLayout,
} from '@oon/instrument-layouts';
import type { ScoreLayout } from '@oon/score-engraving';

/**
 * Song 한 시스템 (= score wrap 단위 한 줄). progression/score/drum이 동일 마디에 정렬된다.
 * 각 row의 y는 system 좌상단 기준의 상대 좌표.
 */
export interface SongSystemRow {
  systemIndex: number;
  /** Song 좌상단 기준 절대 y. */
  y: number;
  height: number;
  progression?: { y: number; height: number; cards: ProgressionCardLayout[] };
  /**
   * 단일 system만 담은 ScoreLayout. 이 ScoreLayout 내부의 y 값들은 system-local 기준
   * (= staff center가 staffY에 위치). 렌더링 시 originY로 전체 SongSystemRow.y에 더한다.
   */
  score: { y: number; height: number; layout: ScoreLayout };
  drum?: { y: number; height: number; layout: DrumLayout };
}

export interface SongLayout extends LayoutBase {
  /** 최상단에 한 번만 그려지는 키보드. y는 0부터 시작. */
  keyboard: { y: number; height: number; layout: KeyboardLayout };
  systems: SongSystemRow[];
}
