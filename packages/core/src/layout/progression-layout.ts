import type { ProgressionNode } from '../ast/types.js';
import type { ProgressionCardLayout, ProgressionLayout } from './types.js';

export interface ProgressionLayoutOptions {
  width: number;
  cardHeight?: number;
  gap?: number;
  columns?: number;
}

export function calculateProgressionLayout(
  node: ProgressionNode,
  opts: ProgressionLayoutOptions,
): ProgressionLayout {
  const width = opts.width;
  const cardHeight = opts.cardHeight ?? 120;
  const gap = opts.gap ?? 8;
  const cols = opts.columns ?? Math.min(node.bars.length, 4);
  const rows = Math.ceil(node.bars.length / cols);
  const cardWidth = (width - gap * (cols - 1)) / cols;

  const cards: ProgressionCardLayout[] = node.bars.map((bar, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = col * (cardWidth + gap);
    const y = row * (cardHeight + gap);
    const totalBeats = bar.chords.reduce((s, c) => s + c.beats, 0) || 1;
    let beatCursor = 0;

    const chords = bar.chords.map((c) => {
      const innerX = x + (beatCursor / totalBeats) * cardWidth;
      const innerWidth = (c.beats / totalBeats) * cardWidth;
      beatCursor += c.beats;
      return {
        symbol: c.symbol,
        notes: c.notes,
        beats: c.beats,
        rect: { x: innerX, y, width: innerWidth, height: cardHeight },
        ...(c.roman !== undefined ? { roman: c.roman } : {}),
      };
    });

    return {
      barNumber: bar.barNumber,
      rect: { x, y, width: cardWidth, height: cardHeight },
      chords,
    };
  });

  const height = rows * cardHeight + (rows - 1) * gap;
  return { width, height, cards, cols, rows };
}
