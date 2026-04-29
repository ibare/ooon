import type { Projector } from '@oon/shared';
import type { SongLayout } from '@oon/composition';
import type { DrumLayout } from '@oon/instrument-layouts';
import { METRICS, THEME } from '../theme.js';

export interface SongDrumHitsOptions {
  originX?: number;
  originY?: number;
  /** 한 hit이 사그라들기까지의 beat 길이. 기본 0.25(16분음표 한 개). */
  decayBeats?: number;
  /** 임팩트 시 타일이 커지는 비율. 1.0 + maxScale 까지. 기본 0.18. */
  maxScale?: number;
  /** 임팩트 시 흰색 flash 오버레이의 최대 alpha. 기본 0.55. */
  flashAlpha?: number;
}

const DEFAULT_DECAY_BEATS = 0.5;
const DEFAULT_MAX_SCALE = 0.55;
const DEFAULT_FLASH_ALPHA = 0.9;
/** 외곽으로 퍼지는 ring의 최종 스케일(시작 1.0 → 끝 1 + RING_SCALE). */
const RING_MAX_SCALE = 0.9;
/** ring 외곽선 두께. */
const RING_STROKE_WIDTH = 2;
/** ring의 시작 alpha (감쇠하면서 0으로). */
const RING_ALPHA = 0.7;

/** 헥스(#rrggbb)에 alpha를 입혀 rgba()로 변환. 그 외 입력은 원본 반환. */
function withAlpha(color: string, alpha: number): string {
  const m = /^#([0-9a-fA-F]{6})$/.exec(color);
  if (!m) return color;
  const hex = m[1]!;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
}

const TRACK_GROUP_COLOR: Record<string, string> = {
  HH: THEME.drumCellTop,
  CR: THEME.drumCellTop,
  RD: THEME.drumCellTop,
  SN: THEME.drumCellMid,
  TM: THEME.drumCellMid,
  KK: THEME.drumCellBottom,
};

/**
 * 재생 중인 song의 드럼 트랙 위에 hit envelope(스케일 업 + 흰색 flash)을 그린다.
 * 활성 셀(cell.active === true)이고 hitBeat가 [beat - decayBeats, beat) 범위에 있을 때
 * progress = (beat - hitBeat)/decayBeats, decay = 1 - progress 의 envelope를 적용.
 *
 * 한 system 내부에서 마지막 셀이 다음 system 시작 직후까지 잔향이 남는 경우를 위해
 * decay 윈도우에 닿는 모든 system을 순회한다.
 */
export function drawSongDrumHits(
  projector: Projector,
  layout: SongLayout,
  beat: number,
  beatsPerBar: number,
  opts: SongDrumHitsOptions = {},
): void {
  const ox = opts.originX ?? 0;
  const oy = opts.originY ?? 0;
  const decayBeats = opts.decayBeats ?? DEFAULT_DECAY_BEATS;
  const maxScale = opts.maxScale ?? DEFAULT_MAX_SCALE;
  const flashAlpha = opts.flashAlpha ?? DEFAULT_FLASH_ALPHA;

  let beatStart = 0;
  for (const sys of layout.systems) {
    const barsInSys = sys.score.layout.systems[0]?.bars.length ?? 0;
    const beatSpan = barsInSys * beatsPerBar;
    if (sys.drum) {
      const beatInSys = beat - beatStart;
      // 이 system이 hit decay 윈도우에 닿는지 — 너무 미래거나 충분히 과거라면 스킵.
      if (beatInSys >= 0 && beatInSys < beatSpan + decayBeats) {
        renderHitsForSystem(
          projector,
          sys.drum.layout,
          beatInSys,
          ox,
          oy + sys.y + sys.drum.y,
          decayBeats,
          maxScale,
          flashAlpha,
        );
      }
    }
    beatStart += beatSpan;
  }
}

function renderHitsForSystem(
  projector: Projector,
  drumLayout: DrumLayout,
  beatInSys: number,
  ox: number,
  oy: number,
  decayBeats: number,
  maxScale: number,
  flashAlpha: number,
): void {
  const inset = METRICS.drumCellActiveInset;
  const radius = METRICS.drumCellActiveRadius;
  const cellsPerBeat = drumLayout.resolution / drumLayout.beatsPerBar;

  projector.save();
  projector.translate(ox, oy);

  for (const cell of drumLayout.cells) {
    if (!cell.active) continue;
    const hitBeat = cell.barIndex * drumLayout.beatsPerBar + cell.cellIndex / cellsPerBeat;
    const progress = (beatInSys - hitBeat) / decayBeats;
    if (progress < 0 || progress >= 1) continue;

    // 비선형 감쇠: 초반에 천천히 떨어져 임팩트가 시각적으로 더 오래 보이게.
    const decay = Math.sqrt(1 - progress);
    const baseW = cell.width - 2 * inset;
    const baseH = cell.height - 2 * inset;
    if (baseW <= 0 || baseH <= 0) continue;
    const cx = cell.x + cell.width / 2;
    const cy = cell.y + cell.height / 2;
    const groupColor = TRACK_GROUP_COLOR[cell.track] ?? THEME.drumCellMid;

    // 1) 임팩트 타일: 그룹 색으로 enlarged.
    const scale = 1 + maxScale * decay;
    const tileW = baseW * scale;
    const tileH = baseH * scale;
    const tile = { x: cx - tileW / 2, y: cy - tileH / 2, width: tileW, height: tileH };
    projector.drawRect(tile, groupColor, undefined, 0, radius);

    // 2) 흰색 flash 오버레이.
    const alpha = flashAlpha * decay;
    if (alpha > 0.01) {
      projector.drawRect(
        tile,
        `rgba(255,255,255,${alpha.toFixed(3)})`,
        undefined,
        0,
        radius,
      );
    }

    // 3) 외곽으로 퍼지는 ring — progress에 따라 외곽 스케일이 커지고 alpha는 줄어든다.
    const ringScale = 1 + RING_MAX_SCALE * progress;
    const ringW = baseW * ringScale;
    const ringH = baseH * ringScale;
    const ringAlpha = RING_ALPHA * (1 - progress);
    if (ringAlpha > 0.02) {
      const ringColor = withAlpha(groupColor, ringAlpha);
      projector.drawRect(
        { x: cx - ringW / 2, y: cy - ringH / 2, width: ringW, height: ringH },
        undefined,
        ringColor,
        RING_STROKE_WIDTH,
        radius,
      );
    }
  }

  projector.restore();
}
