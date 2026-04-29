import type { ProgressionNode } from '@oon/core';
import type { ProgressionCardLayout, ProgressionLayout } from './types.js';

export interface ProgressionLayoutOptions {
  width: number;
  cardHeight?: number;
  gap?: number;
  /**
   * 카드 한 장의 최소 폭. (width - gaps) / N 이 이 값보다 작으면 minCardWidth로 클램프된다.
   * 그 결과 layout.width 가 입력 width 를 초과할 수 있다 — 컨테이너 측에서 가로 스크롤로 처리.
   */
  minCardWidth?: number;
}

export function calculateProgressionLayout(
  node: ProgressionNode,
  opts: ProgressionLayoutOptions,
): ProgressionLayout {
  const width = opts.width;
  const cardHeight = opts.cardHeight ?? 120;
  const gap = opts.gap ?? 8;
  const minCardWidth = opts.minCardWidth ?? 80;
  const n = Math.max(node.bars.length, 1);

  const fitCardWidth = (width - gap * (n - 1)) / n;
  const cardWidth = Math.max(minCardWidth, fitCardWidth);

  const cards: ProgressionCardLayout[] = node.bars.map((bar, i) => {
    const x = i * (cardWidth + gap);
    const y = 0;
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

  const totalWidth = n * cardWidth + (n - 1) * gap;
  return { width: totalWidth, height: cardHeight, cards };
}

export interface ProgressionSystemBar {
  barNumber: number;
  x: number;
  width: number;
  chords: {
    symbol: string;
    notes: readonly string[];
    beats: number;
    roman?: string;
  }[];
}

export interface ProgressionSystemLayoutOptions {
  bars: ProgressionSystemBar[];
  cardHeight?: number;
}

/**
 * 외부에서 마디 X/너비를 주입받아 카드를 정렬한다.
 * Song 레이아웃에서 Score 마디 좌표에 Progression을 1:1 동기 정렬할 때 사용한다.
 */
export function calculateProgressionSystemLayout(
  opts: ProgressionSystemLayoutOptions,
): ProgressionLayout {
  const cardHeight = opts.cardHeight ?? 80;
  const cards: ProgressionCardLayout[] = opts.bars.map((bar) => {
    const totalBeats = bar.chords.reduce((s, c) => s + c.beats, 0) || 1;
    let beatCursor = 0;
    const chords = bar.chords.map((c) => {
      const innerX = bar.x + (beatCursor / totalBeats) * bar.width;
      const innerWidth = (c.beats / totalBeats) * bar.width;
      beatCursor += c.beats;
      return {
        symbol: c.symbol,
        notes: c.notes,
        beats: c.beats,
        rect: { x: innerX, y: 0, width: innerWidth, height: cardHeight },
        ...(c.roman !== undefined ? { roman: c.roman } : {}),
      };
    });
    return {
      barNumber: bar.barNumber,
      rect: { x: bar.x, y: 0, width: bar.width, height: cardHeight },
      chords,
    };
  });

  const totalWidth = cards.reduce((m, c) => Math.max(m, c.rect.x + c.rect.width), 0);
  return { width: totalWidth, height: cardHeight, cards };
}
