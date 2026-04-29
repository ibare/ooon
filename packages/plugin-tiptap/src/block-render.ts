import type { Projector } from '@oon/shared';
import { parseBlock } from '@oon/core';
import {
  calculateDrumLayout,
  calculateFretboardLayout,
  calculateProgressionLayout,
} from '@oon/instrument-layouts';
import { calculateScoreLayout } from '@oon/score-engraving';
import { calculateSongLayout } from '@oon/composition';
import {
  renderDrum,
  renderFretboard,
  renderProgression,
  renderScore,
  renderSong,
} from '@oon/projector-web';
import { OonRenderError } from './errors.js';

export interface RenderBlockOptions {
  width: number;
  showNoteNames?: boolean;
}

export interface BlockRenderResult {
  height: number;
  warnings: string[];
}

export function renderBlockToProjector(
  projector: Projector,
  source: string,
  opts: RenderBlockOptions,
): BlockRenderResult {
  let node;
  try {
    node = parseBlock(source);
  } catch (err) {
    throw new OonRenderError(`Failed to parse Oon block: ${(err as Error).message}`, { cause: err });
  }

  projector.clear();

  switch (node.type) {
    case 'score': {
      const layout = calculateScoreLayout(node, { width: opts.width });
      renderScore(projector, layout, {
        ...(opts.showNoteNames !== undefined ? { showNoteNames: opts.showNoteNames } : {}),
      });
      return { height: layout.height, warnings: node.warnings };
    }
    case 'drum': {
      const layout = calculateDrumLayout(node, { width: opts.width });
      renderDrum(projector, layout);
      return { height: layout.height, warnings: node.warnings };
    }
    case 'progression': {
      const layout = calculateProgressionLayout(node, { width: opts.width });
      renderProgression(projector, layout);
      return { height: layout.height, warnings: node.warnings };
    }
    case 'fretboard': {
      const layout = calculateFretboardLayout(node, { width: opts.width });
      renderFretboard(projector, layout);
      return { height: layout.height, warnings: [] };
    }
    case 'song': {
      const layout = calculateSongLayout(node, { width: opts.width });
      renderSong(projector, layout, {
        ...(opts.showNoteNames !== undefined ? { showNoteNames: opts.showNoteNames } : {}),
      });
      return { height: layout.height, warnings: node.warnings };
    }
  }
}
