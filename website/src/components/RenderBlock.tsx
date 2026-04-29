import { useEffect, useRef } from 'react';
import {
  calculateDrumLayout,
  calculateFretboardLayout,
  calculateProgressionLayout,
  parseBlock,
} from '@oon/core';
import { calculateScoreLayout, calculateSongLayout } from '@oon/score-engraving';
import {
  CanvasProjector,
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
}

function renderToProjector(
  projector: CanvasProjector,
  source: string,
  width: number,
  showNoteNames: boolean,
): { height: number; error?: string } {
  let node;
  try {
    node = parseBlock(source);
  } catch (err) {
    return { height: 0, error: (err as Error).message };
  }
  projector.clear();
  switch (node.type) {
    case 'score': {
      const layout = calculateScoreLayout(node, { width });
      renderScore(projector, layout, { showNoteNames });
      return { height: layout.height };
    }
    case 'drum': {
      const layout = calculateDrumLayout(node, { width });
      renderDrum(projector, layout);
      return { height: layout.height };
    }
    case 'progression': {
      const layout = calculateProgressionLayout(node, { width });
      renderProgression(projector, layout);
      return { height: layout.height };
    }
    case 'fretboard': {
      const layout = calculateFretboardLayout(node, { width });
      renderFretboard(projector, layout);
      return { height: layout.height };
    }
    case 'song': {
      const layout = calculateSongLayout(node, { width });
      renderSong(projector, layout, { showNoteNames });
      return { height: layout.height };
    }
  }
}

const FONT_URL = `${import.meta.env.BASE_URL}fonts/Bravura.woff2`;

export default function RenderBlock({
  source,
  width = 640,
  showNoteNames = false,
}: RenderBlockProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const errorEl = errorRef.current;
    if (!canvas || !errorEl) return;

    let cancelled = false;
    const projector = new CanvasProjector(canvas);

    async function run(err: HTMLDivElement): Promise<void> {
      try {
        await loadBravura({ url: FONT_URL });
      } catch {
        // font optional; fall through
      }
      if (cancelled) return;
      const first = renderToProjector(projector, source, width, showNoteNames);
      if (first.error) {
        err.textContent = first.error;
        return;
      }
      err.textContent = '';
      projector.resize(width, first.height);
      const second = renderToProjector(projector, source, width, showNoteNames);
      if (second.error) {
        err.textContent = second.error;
      }
    }

    void run(errorEl);
    return () => {
      cancelled = true;
    };
  }, [source, width, showNoteNames]);

  return (
    <div>
      <canvas ref={canvasRef} className="oon-canvas" />
      <div
        ref={errorRef}
        style={{ color: '#b91c1c', fontSize: '0.85em', marginTop: '0.4em', whiteSpace: 'pre-wrap' }}
      />
    </div>
  );
}
