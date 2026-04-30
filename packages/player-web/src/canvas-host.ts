import { parseBlock, type BlockNode, type SongNode } from '@oon/core';
import {
  calculateDrumLayout,
  calculateFretboardLayout,
  calculateProgressionLayout,
  type DrumLayout,
  type FretboardLayout,
  type ProgressionLayout,
} from '@oon/instrument-layouts';
import { calculateScoreLayout, type ScoreLayout } from '@oon/score-engraving';
import {
  calculateSongLayout,
  getSongActiveNotes,
  type SongLayout,
} from '@oon/composition';
import {
  CanvasProjector,
  drawKeyboardHighlights,
  drawSongDrumHits,
  drawSongPlayheadOverlay,
  loadBravura,
  renderDrum,
  renderFretboard,
  renderProgression,
  renderScore,
  renderSong,
} from '@oon/projector-web';
import type { TrackMute } from './audio/playback.js';

export interface CanvasHostOptions {
  /** 작성자 의도 콘텐츠 폭. 미지정 시 컨테이너 폭 자동. */
  width?: number;
  showNoteNames?: boolean;
  /** Bravura 폰트 URL. 미지정 시 'fonts/Bravura.woff2' (host base 상대). */
  bravuraUrl?: string;
}

export type ParsedLayout =
  | { kind: 'score'; layout: ScoreLayout; node: BlockNode }
  | { kind: 'drum'; layout: DrumLayout; node: BlockNode }
  | { kind: 'progression'; layout: ProgressionLayout; node: BlockNode }
  | { kind: 'fretboard'; layout: FretboardLayout; node: BlockNode }
  | {
      kind: 'song';
      layout: SongLayout;
      node: SongNode;
      bpm: number;
      beatsPerBar: number;
      durationBeats: number;
    };

const MIN_AUTO_WIDTH = 320;
const RESIZE_DEBOUNCE_MS = 80;

function buildLayout(node: BlockNode, width: number): ParsedLayout {
  switch (node.type) {
    case 'score':
      return { kind: 'score', layout: calculateScoreLayout(node, { width }), node };
    case 'drum':
      return { kind: 'drum', layout: calculateDrumLayout(node, { width }), node };
    case 'progression':
      return { kind: 'progression', layout: calculateProgressionLayout(node, { width }), node };
    case 'fretboard':
      return { kind: 'fretboard', layout: calculateFretboardLayout(node, { width }), node };
    case 'song': {
      const layout = calculateSongLayout(node, { width });
      return {
        kind: 'song',
        layout,
        node,
        bpm: node.bpm,
        beatsPerBar: node.timeSignature.beats,
        durationBeats: node.bars.length * node.timeSignature.beats,
      };
    }
  }
}

function paint(
  projector: CanvasProjector,
  state: ParsedLayout,
  showNoteNames: boolean,
  playheadBeat: number | null,
  mute: TrackMute,
): void {
  projector.clear();
  switch (state.kind) {
    case 'score':
      renderScore(projector, state.layout, { showNoteNames });
      return;
    case 'drum':
      renderDrum(projector, state.layout);
      return;
    case 'progression':
      renderProgression(projector, state.layout);
      return;
    case 'fretboard':
      renderFretboard(projector, state.layout);
      return;
    case 'song': {
      const playing = playheadBeat !== null;
      let activeBarNumber: number | undefined;
      let activeChordIndex: number | undefined;
      let activeStep: number | undefined;
      if (playheadBeat !== null) {
        const beatsPerBar = state.beatsPerBar;
        const totalBars = state.node.bars.length;
        const barIdx = Math.min(
          Math.max(0, Math.floor(playheadBeat / beatsPerBar)),
          totalBars - 1,
        );
        activeBarNumber = state.node.bars[barIdx]?.barNumber;
        activeChordIndex = 0;
        const drumResolution = state.layout.systems[0]?.drum?.layout.resolution ?? 16;
        const cellsPerBeat = drumResolution / state.beatsPerBar;
        activeStep = Math.floor(playheadBeat * cellsPerBeat);
      }
      if (playheadBeat !== null) {
        drawSongPlayheadOverlay(projector, state.layout, playheadBeat, state.beatsPerBar);
      }
      renderSong(projector, state.layout, {
        showNoteNames,
        playing,
        mute,
        ...(activeBarNumber !== undefined ? { activeBarNumber } : {}),
        ...(activeChordIndex !== undefined ? { activeChordIndex } : {}),
        ...(activeStep !== undefined ? { activeStep } : {}),
      });
      if (playheadBeat !== null) {
        const rawActive = getSongActiveNotes(state.node, playheadBeat, state.beatsPerBar);
        const active = {
          melodyMidi: mute.melody ? null : rawActive.melodyMidi,
          chordMidis: mute.chord ? [] : rawActive.chordMidis,
          rootMidi: mute.chord ? null : rawActive.rootMidi,
        };
        drawKeyboardHighlights(projector, state.layout.keyboard.layout, active, {
          originY: state.layout.keyboard.y,
        });
        if (!mute.drum) {
          drawSongDrumHits(projector, state.layout, playheadBeat, state.beatsPerBar);
        }
      }
      return;
    }
  }
}

export interface CanvasHostHandle {
  /** DSL 소스 또는 미리 파싱된 노드를 교체한다. 즉시 재레이아웃 후 idle 페인트. */
  setSource(source: string | BlockNode): void;
  /** 트랙 mute 갱신. 재생 중이면 다음 RAF tick에서, idle이면 즉시 재페인트. */
  setMute(mute: TrackMute): void;
  /** Song에서만 의미. true면 RAF 루프 시작, false면 멈추고 idle 페인트. */
  setPlaying(playing: boolean): void;
  /** 레이아웃 종류 — Song만 트랙 chip 대상. */
  getKind(): ParsedLayout['kind'] | null;
  /** 호스트가 RAF를 자체 종료하고 idle로 돌리고 싶을 때(예: 외부 audio 종료 트리거). */
  resetPlayhead(): void;
  /** 가장 최근 파싱 에러 텍스트. 없으면 빈 문자열. */
  getErrorText(): string;
  dispose(): void;
}

/**
 * Canvas + 레이아웃 + RAF + ResizeObserver 통합 호스트.
 * DOM 두 개를 host에 부착한다: `<canvas>`와 에러 표시용 `<div>`.
 */
export function createCanvasHost(
  host: HTMLElement,
  opts: CanvasHostOptions = {},
): CanvasHostHandle {
  const scrollEl = document.createElement('div');
  scrollEl.className = 'oon-canvas-scroll';
  const canvas = document.createElement('canvas');
  canvas.className = 'oon-canvas';
  scrollEl.appendChild(canvas);
  const errorEl = document.createElement('div');
  errorEl.style.color = '#b91c1c';
  errorEl.style.fontSize = '0.85em';
  errorEl.style.marginTop = '0.4em';
  errorEl.style.whiteSpace = 'pre-wrap';
  host.appendChild(scrollEl);
  host.appendChild(errorEl);

  const projector = new CanvasProjector(canvas);

  let currentNode: BlockNode | null = null;
  let state: ParsedLayout | null = null;
  let containerWidth: number | null = null;
  let mute: TrackMute = {};
  let playing = false;
  let rafId: number | null = null;
  let startTime = 0;
  let resizeTimer: ReturnType<typeof setTimeout> | null = null;
  let bravuraLoaded = false;
  let bravuraPromise: Promise<void> | null = null;
  const showNoteNames = opts.showNoteNames ?? false;
  const bravuraUrl = opts.bravuraUrl ?? 'fonts/Bravura.woff2';

  const fontPromise = (): Promise<void> => {
    if (bravuraLoaded) return Promise.resolve();
    if (bravuraPromise) return bravuraPromise;
    bravuraPromise = loadBravura({ url: bravuraUrl })
      .then(() => {
        bravuraLoaded = true;
      })
      .catch(() => {
        // 폰트는 옵션 — 실패해도 렌더는 진행한다.
        bravuraLoaded = true;
      });
    return bravuraPromise;
  };

  const layoutBudget = (): number | null => {
    return opts.width ?? containerWidth;
  };

  const rebuildAndPaint = (): void => {
    const budget = layoutBudget();
    if (currentNode === null || budget === null || budget <= 0 || containerWidth === null) {
      return;
    }
    const built = buildLayout(currentNode, budget);
    state = built;
    const layoutWidth = built.layout.width;
    const layoutHeight = built.layout.height;
    const contentScale = Math.min(1, containerWidth / layoutWidth);
    projector.resize(layoutWidth, layoutHeight, { contentScale });
    paint(projector, built, showNoteNames, null, mute);
  };

  const stopRaf = (): void => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  const startRaf = (): void => {
    stopRaf();
    if (!state || state.kind !== 'song') return;
    startTime = performance.now();
    const tick = (): void => {
      if (!state || state.kind !== 'song') {
        rafId = null;
        return;
      }
      const elapsedSec = (performance.now() - startTime) / 1000;
      const beat = elapsedSec * (state.bpm / 60);
      const clampedBeat = Math.min(beat, state.durationBeats);
      paint(projector, state, showNoteNames, clampedBeat, mute);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  };

  const ro = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (!entry) return;
    const w = Math.max(MIN_AUTO_WIDTH, Math.floor(entry.contentRect.width));
    if (resizeTimer !== null) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (containerWidth === w) return;
      containerWidth = w;
      rebuildAndPaint();
      if (playing) startRaf();
    }, RESIZE_DEBOUNCE_MS);
  });
  ro.observe(host);
  const initialRect = host.getBoundingClientRect();
  if (initialRect.width > 0) {
    containerWidth = Math.max(MIN_AUTO_WIDTH, Math.floor(initialRect.width));
  }

  return {
    setSource(source) {
      let node: BlockNode | null = null;
      if (typeof source === 'string') {
        try {
          node = parseBlock(source);
          errorEl.textContent = '';
        } catch (err) {
          errorEl.textContent = (err as Error).message;
          currentNode = null;
          state = null;
          stopRaf();
          return;
        }
      } else {
        node = source;
        errorEl.textContent = '';
      }
      currentNode = node;
      void fontPromise().then(() => {
        if (currentNode !== node) return;
        rebuildAndPaint();
      });
    },
    setMute(next) {
      mute = { ...next };
      if (rafId !== null) return;
      if (!state) return;
      paint(projector, state, showNoteNames, null, mute);
    },
    setPlaying(next) {
      playing = next;
      if (next) {
        startRaf();
      } else {
        stopRaf();
        if (state) paint(projector, state, showNoteNames, null, mute);
      }
    },
    getKind() {
      return state?.kind ?? null;
    },
    resetPlayhead() {
      stopRaf();
      if (state) paint(projector, state, showNoteNames, null, mute);
    },
    getErrorText() {
      return errorEl.textContent ?? '';
    },
    dispose() {
      stopRaf();
      ro.disconnect();
      if (resizeTimer !== null) clearTimeout(resizeTimer);
      host.removeChild(scrollEl);
      host.removeChild(errorEl);
    },
  };
}
