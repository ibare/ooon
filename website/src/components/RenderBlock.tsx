import { useEffect, useRef } from 'react';
import { parseBlock, type BlockNode } from '@oon/core';
import {
  calculateDrumLayout,
  calculateFretboardLayout,
  calculateProgressionLayout,
  type DrumLayout,
  type FretboardLayout,
  type ProgressionLayout,
} from '@oon/instrument-layouts';
import { calculateScoreLayout, type ScoreLayout } from '@oon/score-engraving';
import { calculateSongLayout, type SongLayout } from '@oon/composition';
import {
  CanvasProjector,
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
    case 'song':
      renderSong(projector, state.layout, { showNoteNames });
      if (playheadBeat !== null) {
        drawSongPlayheadOverlay(projector, state.layout, playheadBeat, state.beatsPerBar);
      }
      return;
  }
}

const FONT_URL = `${import.meta.env.BASE_URL}fonts/Bravura.woff2`;

export default function RenderBlock({
  source,
  width = 640,
  showNoteNames = false,
  playing = false,
}: RenderBlockProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);
  const projectorRef = useRef<CanvasProjector | null>(null);
  const stateRef = useRef<ParsedLayout | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const errorEl = errorRef.current;
    if (!canvas || !errorEl) return;

    let cancelled = false;
    const projector = new CanvasProjector(canvas);
    projectorRef.current = projector;

    async function init(err: HTMLDivElement): Promise<void> {
      try {
        await loadBravura({ url: FONT_URL });
      } catch {
        // font optional
      }
      if (cancelled) return;

      const built = buildLayout(source, width);
      if ('error' in built) {
        err.textContent = built.error;
        stateRef.current = null;
        return;
      }
      err.textContent = '';
      stateRef.current = built;

      const layoutWidth = built.layout.width;
      const layoutHeight = built.layout.height;
      const canvasWidth = Math.max(layoutWidth, width);
      projector.resize(canvasWidth, layoutHeight);
      paint(projector, built, showNoteNames, null);
    }

    void init(errorEl);
    return () => {
      cancelled = true;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      projectorRef.current = null;
      stateRef.current = null;
    };
  }, [source, width, showNoteNames]);

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
    <div>
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
