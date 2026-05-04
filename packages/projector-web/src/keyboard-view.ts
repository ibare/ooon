import {
  calculateKeyboardLayout,
  deriveKeyboardRange,
  type KeyboardLayout,
} from '@oon/instrument-layouts';
import { CanvasProjector } from './canvas-projector.js';
import { renderKeyboard } from './renderers/keyboard-renderer.js';
import {
  drawKeyboardHighlights,
  type KeyboardHighlightInput,
} from './renderers/keyboard-highlights.js';

export type KeyboardRange =
  | 'auto'
  | 'full88'
  | { lowMidi: number; highMidi: number };

export interface KeyboardViewOptions {
  /** 음역 정책. 기본 'full88' — 음이 동적으로 변하는 편집 컨텍스트의 jitter를 막는 안전 기본값. */
  range?: KeyboardRange;
  /** auto 모드일 때 좌우 옥타브 마진. 기본 0. */
  padOctaves?: number;
  /** C 옥타브 라벨(C3, C4 등) 표시. 기본 true. */
  showLabels?: boolean;
}

export interface KeyboardViewHandle {
  /**
   * auto 모드일 때 음역 산출 입력으로 쓸 MIDI 집합을 갱신한다.
   * full88/fixed 모드에서는 무시되고 호출은 안전한 no-op.
   */
  setPitches(midis: readonly number[]): void;
  /** 강조할 활성 키. null이면 강조 제거(키보드만 그린다). */
  setActive(active: KeyboardHighlightInput | null): void;
  dispose(): void;
}

const FULL88_LOW = 21; // A0
const FULL88_HIGH = 108; // C8
const RESIZE_DEBOUNCE_MS = 80;
const MIN_AUTO_WIDTH = 240;

/**
 * 88건반 또는 자동/명시 음역의 키보드를 단독 시각화하는 부품 facade.
 * 호스트는 영역만 확보(host element). 시각 컨벤션(폭 가변 + 자체 높이 + 캔버스만)을 부품이 캡슐화한다.
 *
 * 음역 정책(range):
 * - 'full88': MIDI 21–108 고정. 편집기처럼 음이 동적으로 추가/삭제되는 컨텍스트 기본값.
 * - 'auto':   setPitches로 받은 MIDI 집합의 최저/최고를 옥타브 경계로 정렬해 산출(`deriveKeyboardRange`).
 *             빈 입력이면 fallback C3–C5.
 * - { lowMidi, highMidi }: 명시 고정.
 *
 * 그리기:
 * - `renderKeyboard`로 흰/검은 건반 + (옵션) C 라벨.
 * - `setActive`로 받은 강조 정보가 있으면 `drawKeyboardHighlights`로 활성 키를 덮어 그린다.
 *
 * 컨테이너 폭이 키보드 layout 폭보다 작으면 contentScale로 축소 페인트(가로 스크롤은 두지 않는다 —
 * 키보드는 한 눈에 들어오는 형태가 컨벤션).
 */
export function mountKeyboardView(
  host: HTMLElement,
  opts: KeyboardViewOptions = {},
): KeyboardViewHandle {
  const range: KeyboardRange = opts.range ?? 'full88';
  const padOctaves = opts.padOctaves ?? 0;
  const showLabels = opts.showLabels ?? true;

  const wrap = document.createElement('div');
  wrap.className = 'oon-keyboard-view';
  wrap.style.width = '100%';
  const canvas = document.createElement('canvas');
  canvas.className = 'oon-keyboard-canvas';
  canvas.style.display = 'block';
  wrap.appendChild(canvas);
  host.appendChild(wrap);

  const projector = new CanvasProjector(canvas);

  let pitches: readonly number[] = [];
  let active: KeyboardHighlightInput | null = null;
  let containerWidth: number | null = null;
  let resizeTimer: ReturnType<typeof setTimeout> | null = null;

  const computeRange = (): { lowMidi: number; highMidi: number } => {
    if (range === 'full88') return { lowMidi: FULL88_LOW, highMidi: FULL88_HIGH };
    if (range === 'auto') return deriveKeyboardRange(pitches, { padOctaves });
    return { lowMidi: range.lowMidi, highMidi: range.highMidi };
  };

  const buildLayout = (): KeyboardLayout => {
    const { lowMidi, highMidi } = computeRange();
    return calculateKeyboardLayout({ lowMidi, highMidi, showLabels });
  };

  const paint = (): void => {
    if (containerWidth === null || containerWidth <= 0) return;
    const layout = buildLayout();
    const contentScale = Math.min(1, containerWidth / layout.width);
    projector.resize(layout.width, layout.height, { contentScale });
    projector.clear();
    renderKeyboard(projector, layout, { showLabels });
    if (active) drawKeyboardHighlights(projector, layout, active);
  };

  const ro = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (!entry) return;
    const w = Math.max(MIN_AUTO_WIDTH, Math.floor(entry.contentRect.width));
    if (resizeTimer !== null) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (containerWidth === w) return;
      containerWidth = w;
      paint();
    }, RESIZE_DEBOUNCE_MS);
  });
  ro.observe(wrap);
  const initialRect = wrap.getBoundingClientRect();
  if (initialRect.width > 0) {
    containerWidth = Math.max(MIN_AUTO_WIDTH, Math.floor(initialRect.width));
    paint();
  }

  return {
    setPitches(next) {
      if (range !== 'auto') return;
      pitches = next;
      paint();
    },
    setActive(next) {
      active = next;
      paint();
    },
    dispose() {
      ro.disconnect();
      if (resizeTimer !== null) clearTimeout(resizeTimer);
      if (host.contains(wrap)) host.removeChild(wrap);
    },
  };
}
