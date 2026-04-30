import type { Projector } from '@oon/shared';
import type { SongLayout } from '@oon/composition';
import { renderDrum } from './drum-renderer.js';
import { renderKeyboard } from './keyboard-renderer.js';
import { renderProgression } from './progression-renderer.js';
import { renderScore } from './score-renderer.js';

export interface SongRenderOptions {
  originX?: number;
  originY?: number;
  showNoteNames?: boolean;
  /** 재생 중 활성 마디 번호. progression 카드 입체 강조에 사용. */
  activeBarNumber?: number;
  /** 활성 마디 안의 분할 코드 인덱스(0-based). */
  activeChordIndex?: number;
  /** 재생 중인 절대 step(16분음표 단위, 곡 시작 기준 누적). drum 글로우/외곽선에 사용. */
  activeStep?: number;
  /** 재생 중 여부. drum 렌더러에 글로우 효과를 켤지 결정. */
  playing?: boolean;
}

export function renderSong(
  projector: Projector,
  layout: SongLayout,
  opts: SongRenderOptions = {},
): void {
  const ox = opts.originX ?? 0;
  const oy = opts.originY ?? 0;
  const playing = opts.playing ?? false;
  const activeStep = opts.activeStep;
  const activeBar = opts.activeBarNumber;
  const activeChord = opts.activeChordIndex;

  // 1) 키보드: Song 최상단 1회
  renderKeyboard(projector, layout.keyboard.layout, {
    originX: ox,
    originY: oy + layout.keyboard.y,
    showLabels: true,
  });

  // 2) 시스템 순회: progression → score → drum
  for (let i = 0; i < layout.systems.length; i++) {
    const sys = layout.systems[i]!;
    const sysOriginY = oy + sys.y;
    const isFirstSystem = i === 0;

    if (sys.progression) {
      renderProgression(
        projector,
        {
          width: 0,
          height: sys.progression.height,
          cards: sys.progression.cards,
        },
        {
          originX: ox,
          originY: sysOriginY + sys.progression.y,
          ...(activeBar !== undefined ? { activeBarNumber: activeBar } : {}),
          ...(activeChord !== undefined ? { activeChordIndex: activeChord } : {}),
        },
      );
    }

    renderScore(projector, sys.score.layout, {
      originX: ox,
      originY: sysOriginY + sys.score.y,
      ...(opts.showNoteNames !== undefined ? { showNoteNames: opts.showNoteNames } : {}),
    });

    if (sys.drum) {
      // 시스템 내 활성 step은 system local로 변환 — system이 담는 첫 마디부터 0이 시작.
      const sysScore = sys.score.layout.systems[0];
      const firstBarNum = sysScore?.bars[0]?.barNumber ?? 1;
      const sysFirstStep = (firstBarNum - 1) * sys.drum.layout.resolution;
      const localActiveStep =
        activeStep !== undefined ? activeStep - sysFirstStep : undefined;
      renderDrum(projector, sys.drum.layout, {
        originX: ox,
        originY: sysOriginY + sys.drum.y,
        showLabels: isFirstSystem,
        playing,
        ...(localActiveStep !== undefined ? { activeStep: localActiveStep } : {}),
      });
    }
  }
}
