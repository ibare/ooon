import type { Projector } from '@ooon/shared';
import { parseBlock } from '@ooon/core';
import {
  calculateDrumLayout,
  calculateFretboardLayout,
  calculateProgressionLayout,
} from '@ooon/instrument-layouts';
import { calculateScoreLayout } from '@ooon/score-engraving';
import { calculateSongLayout } from '@ooon/composition';
import {
  renderDrum,
  renderFretboard,
  renderProgression,
  renderScore,
  renderSong,
} from '@ooon/projector-web';
import { OoonRenderError } from './errors.js';

export interface RenderBlockOptions {
  width: number;
  showNoteNames?: boolean;
}

export interface BlockRenderResult {
  width: number;
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
    throw new OoonRenderError(`Failed to parse Ooon block: ${(err as Error).message}`, { cause: err });
  }

  projector.clear();

  switch (node.type) {
    case 'score': {
      const layout = calculateScoreLayout(node, { width: opts.width });
      renderScore(projector, layout, {
        ...(opts.showNoteNames !== undefined ? { showNoteNames: opts.showNoteNames } : {}),
      });
      return { width: layout.width, height: layout.height, warnings: node.warnings };
    }
    case 'drum': {
      const layout = calculateDrumLayout(node, { width: opts.width });
      renderDrum(projector, layout);
      return { width: layout.width, height: layout.height, warnings: node.warnings };
    }
    case 'progression': {
      const layout = calculateProgressionLayout(node, { width: opts.width });
      renderProgression(projector, layout);
      return { width: layout.width, height: layout.height, warnings: node.warnings };
    }
    case 'fretboard': {
      const layout = calculateFretboardLayout(node, { width: opts.width });
      renderFretboard(projector, layout);
      return { width: layout.width, height: layout.height, warnings: [] };
    }
    case 'song': {
      const layout = calculateSongLayout(node, { width: opts.width });
      renderSong(projector, layout, {
        ...(opts.showNoteNames !== undefined ? { showNoteNames: opts.showNoteNames } : {}),
      });
      return { width: layout.width, height: layout.height, warnings: node.warnings };
    }
  }
}
