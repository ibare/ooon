import { useEffect, useRef, useState } from 'react';
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
  renderDrum,
  renderFretboard,
  renderProgression,
  renderScore,
  renderSong,
  loadBravura,
} from '@oon/projector-web';

export interface RenderBlockProps {
  source: string;
  /** 명시적 폭. 미지정 시 컨테이너 폭에 따라 ResizeObserver로 자동 산정. */
  width?: number;
  showNoteNames?: boolean;
  /** true이면 RAF 루프로 playhead overlay를 동기화. song mode 한정. */
  playing?: boolean;
}

type ParsedLayout =
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

function buildLayout(source: string, width: number): ParsedLayout | { error: string } {
  let node: BlockNode;
  try {
    node = parseBlock(source);
  } catch (err) {
    return { error: (err as Error).message };
  }
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
        // step 단위는 drum layout의 실제 resolution을 따른다.
        // shuffle(resolution=12)·기본(16)에 모두 정합. drum 트랙이 없는 곡은 16으로 폴백.
        const drumResolution = state.layout.systems[0]?.drum?.layout.resolution ?? 16;
        const cellsPerBeat = drumResolution / state.beatsPerBar;
        activeStep = Math.floor(playheadBeat * cellsPerBeat);
      }
      // 1) 마디 배경 + 점선은 본문 아래에 깔린다.
      if (playheadBeat !== null) {
        drawSongPlayheadOverlay(projector, state.layout, playheadBeat, state.beatsPerBar);
      }
      renderSong(projector, state.layout, {
        showNoteNames,
        playing,
        ...(activeBarNumber !== undefined ? { activeBarNumber } : {}),
        ...(activeChordIndex !== undefined ? { activeChordIndex } : {}),
        ...(activeStep !== undefined ? { activeStep } : {}),
      });
      if (playheadBeat !== null) {
        const active = getSongActiveNotes(state.node, playheadBeat, state.beatsPerBar);
        drawKeyboardHighlights(projector, state.layout.keyboard.layout, active, {
          originY: state.layout.keyboard.y,
        });
        drawSongDrumHits(projector, state.layout, playheadBeat, state.beatsPerBar);
      }
      return;
    }
  }
}

const FONT_URL = `${import.meta.env.BASE_URL}fonts/Bravura.woff2`;
const MIN_AUTO_WIDTH = 320;
const RESIZE_DEBOUNCE_MS = 80;

export default function RenderBlock({
  source,
  width,
  showNoteNames = false,
  playing = false,
}: RenderBlockProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);
  const projectorRef = useRef<CanvasProjector | null>(null);
  const stateRef = useRef<ParsedLayout | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  // 실제 컨테이너 측정 폭. width prop과 무관하게 항상 추적해 contentScale을 산출한다.
  const [containerWidth, setContainerWidth] = useState<number | null>(null);

  // ResizeObserver는 width prop 유무와 무관하게 항상 동작 — 컨테이너 폭이 항상 표시 fit의 진실.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.max(MIN_AUTO_WIDTH, Math.floor(entry.contentRect.width));
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(() => {
        setContainerWidth((prev) => (prev === w ? prev : w));
      }, RESIZE_DEBOUNCE_MS);
    });
    ro.observe(el);
    // 초기치 — 첫 paint를 디바운스 우회로 즉시 트리거.
    const rect = el.getBoundingClientRect();
    if (rect.width > 0) {
      setContainerWidth(Math.max(MIN_AUTO_WIDTH, Math.floor(rect.width)));
    }
    return () => {
      if (timer !== null) clearTimeout(timer);
      ro.disconnect();
    };
  }, []);

  // layoutBudget: layout 산출에 입력할 폭 — 작성자가 의도한 콘텐츠 밀도(width prop) 우선,
  //              미지정 시 컨테이너 폭으로 fallback.
  const layoutBudget = width ?? containerWidth;

  useEffect(() => {
    const canvas = canvasRef.current;
    const errorEl = errorRef.current;
    if (!canvas || !errorEl) return;
    if (layoutBudget === null || layoutBudget <= 0) return;
    if (containerWidth === null || containerWidth <= 0) return;

    let cancelled = false;
    const projector = new CanvasProjector(canvas);
    projectorRef.current = projector;

    async function init(
      err: HTMLDivElement,
      budget: number,
      cw: number,
    ): Promise<void> {
      try {
        await loadBravura({ url: FONT_URL });
      } catch {
        // font optional
      }
      if (cancelled) return;

      const built = buildLayout(source, budget);
      if ('error' in built) {
        err.textContent = built.error;
        stateRef.current = null;
        return;
      }
      err.textContent = '';
      stateRef.current = built;

      const layoutWidth = built.layout.width;
      const layoutHeight = built.layout.height;
      // 표시 fit은 항상 컨테이너 폭 기준 — width prop이 명시되어도 컨테이너가 더 좁으면 축소.
      const contentScale = Math.min(1, cw / layoutWidth);
      projector.resize(layoutWidth, layoutHeight, { contentScale });
      paint(projector, built, showNoteNames, null);
    }

    void init(errorEl, layoutBudget, containerWidth);
    return () => {
      cancelled = true;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      projectorRef.current = null;
      stateRef.current = null;
    };
  }, [source, layoutBudget, containerWidth, showNoteNames]);

  useEffect(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const projector = projectorRef.current;
    const state = stateRef.current;
    if (!projector || !state) return;

    if (!playing || state.kind !== 'song') {
      paint(projector, state, showNoteNames, null);
      return;
    }

    startTimeRef.current = performance.now();

    const tick = (): void => {
      const proj = projectorRef.current;
      const cur = stateRef.current;
      if (!proj || !cur || cur.kind !== 'song') {
        rafRef.current = null;
        return;
      }
      const elapsedSec = (performance.now() - startTimeRef.current) / 1000;
      const beat = elapsedSec * (cur.bpm / 60);
      const clampedBeat = Math.min(beat, cur.durationBeats);
      paint(proj, cur, showNoteNames, clampedBeat);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      const proj = projectorRef.current;
      const cur = stateRef.current;
      if (proj && cur) {
        paint(proj, cur, showNoteNames, null);
      }
    };
  }, [playing, showNoteNames]);

  return (
    <div ref={containerRef}>
      <div className="oon-canvas-scroll">
        <canvas ref={canvasRef} className="oon-canvas" />
      </div>
      <div
        ref={errorRef}
        style={{ color: '#b91c1c', fontSize: '0.85em', marginTop: '0.4em', whiteSpace: 'pre-wrap' }}
      />
    </div>
  );
}
