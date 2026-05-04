import { parseBlock, type BlockNode, type SongNode } from '@oon/core';
import type { TrackMute } from '@oon/shared';
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
import { CanvasProjector } from './canvas-projector.js';
import { loadBravura } from './font-loader.js';
import { renderScore } from './renderers/score-renderer.js';
import { renderDrum } from './renderers/drum-renderer.js';
import { renderProgression } from './renderers/progression-renderer.js';
import { renderFretboard } from './renderers/fretboard-renderer.js';
import { renderSong } from './renderers/song-renderer.js';
import { drawSongPlayheadOverlay } from './renderers/playhead-overlay.js';
import { drawKeyboardHighlights } from './renderers/keyboard-highlights.js';
import { drawSongDrumHits } from './renderers/drum-hits.js';

export interface BlockViewOptions {
  /** 작성자 의도 콘텐츠 폭. 미지정 시 컨테이너 폭 자동. */
  width?: number;
  showNoteNames?: boolean;
  /** Bravura 폰트 URL. 미지정 시 'fonts/Bravura.woff2' (host base 상대). */
  bravuraUrl?: string;
}

export type BlockViewKind = 'score' | 'drum' | 'progression' | 'fretboard' | 'song';

export type ParsedBlockLayout =
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

export interface BlockViewHandle {
  /** DSL 소스 또는 미리 파싱된 노드를 교체한다. 파싱 후 즉시 idle 페인트. */
  setSource(source: string | BlockNode): void;
  /** 트랙 mute 갱신. 즉시 재페인트. */
  setMute(mute: TrackMute): void;
  /**
   * Song 재생 중인 비트 위치를 외부에서 주입한다(0 ≤ beat ≤ durationBeats).
   * `null`은 정지 상태(idle 페인트, 플레이헤드/하이라이트 제거).
   * Song 외 블록에는 무시되고 항상 idle 페인트.
   */
  setPlayhead(beat: number | null): void;
  /** 현재 파싱된 블록 종류. 파싱 실패 시 null. */
  getKind(): BlockViewKind | null;
  /**
   * Song 블록일 때만 timing 정보를 돌려준다(외부에서 setPlayhead 환산용).
   * Song이 아니거나 미파싱 상태면 null.
   */
  getSongTiming(): { bpm: number; beatsPerBar: number; durationBeats: number } | null;
  /** 가장 최근 파싱 에러 텍스트. 없으면 빈 문자열. */
  getErrorText(): string;
  dispose(): void;
}

const MIN_AUTO_WIDTH = 320;
const RESIZE_DEBOUNCE_MS = 80;

function buildLayout(node: BlockNode, width: number): ParsedBlockLayout {
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
  state: ParsedBlockLayout,
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

/**
 * 한 블록(score/drum/progression/fretboard/song) 한 개를 자체 캔버스에 그리는 컴포넌트.
 * host 안에 `<div class="oon-canvas-scroll"><canvas/></div>`와 에러 표시용 `<div>`를 부착한다.
 *
 * 시각화 책임만 진다 — DSL 파싱, 레이아웃 계산, Bravura 폰트 로드, ResizeObserver 기반 재페인트,
 * Song 플레이헤드 오버레이 + 활성 노트 키보드 하이라이트. 재생 timing은 다루지 않는다(외부 호출자가
 * `setPlayhead(beat)`로 주입). 따라서 오디오 의존성은 없다.
 */
export function mountBlockView(host: HTMLElement, opts: BlockViewOptions = {}): BlockViewHandle {
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
  let state: ParsedBlockLayout | null = null;
  let containerWidth: number | null = null;
  let mute: TrackMute = {};
  let playheadBeat: number | null = null;
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
    paint(projector, built, showNoteNames, playheadBeat, mute);
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
          playheadBeat = null;
          projector.clear();
          return;
        }
      } else {
        node = source;
        errorEl.textContent = '';
      }
      currentNode = node;
      playheadBeat = null;
      void fontPromise().then(() => {
        if (currentNode !== node) return;
        rebuildAndPaint();
      });
    },
    setMute(next) {
      mute = { ...next };
      if (state) paint(projector, state, showNoteNames, playheadBeat, mute);
    },
    setPlayhead(beat) {
      playheadBeat = beat;
      if (state) paint(projector, state, showNoteNames, playheadBeat, mute);
    },
    getKind() {
      return state?.kind ?? null;
    },
    getSongTiming() {
      if (!state || state.kind !== 'song') return null;
      return {
        bpm: state.bpm,
        beatsPerBar: state.beatsPerBar,
        durationBeats: state.durationBeats,
      };
    },
    getErrorText() {
      return errorEl.textContent ?? '';
    },
    dispose() {
      ro.disconnect();
      if (resizeTimer !== null) clearTimeout(resizeTimer);
      if (host.contains(scrollEl)) host.removeChild(scrollEl);
      if (host.contains(errorEl)) host.removeChild(errorEl);
    },
  };
}
