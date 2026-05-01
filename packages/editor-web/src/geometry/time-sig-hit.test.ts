import { describe, expect, it } from 'vitest';
import type { ScoreLayout } from '@oon/score-engraving';
import { calculateTimeSigHits, findTimeSigHitAt } from './time-sig-hit.js';

function makeLayout(): ScoreLayout {
  return {
    width: 400,
    height: 60,
    systems: [
      {
        index: 0,
        y: 0,
        height: 60,
        staff: { y: 30, top: 10, bottom: 50, lineGap: 10, lines: [10, 20, 30, 40, 50] },
        clef: { x: 0, y: 0, glyph: '' },
        keySig: [],
        timeSig: { x: 60, topGlyph: '4', topY: 20, bottomGlyph: '4', bottomY: 40 },
        contentStart: 90,
        bars: [{ barNumber: 1, x: 90, width: 200, barlineX: 290, notes: [], beams: [] }],
      },
    ],
  };
}

describe('calculateTimeSigHits', () => {
  it('각 system 당 하나의 hit 영역, x=timeSig.x ~ contentStart, y=staff.top~bottom', () => {
    const hits = calculateTimeSigHits(makeLayout());
    expect(hits).toHaveLength(1);
    expect(hits[0]).toEqual({
      systemIndex: 0,
      x: 60,
      y: 10,
      width: 30,
      height: 40,
    });
  });

  it('contentStart가 timeSig.x보다 작은 비정상 입력은 width=0으로 클램프', () => {
    const layout = makeLayout();
    layout.systems[0]!.contentStart = 50; // < timeSig.x(60)
    const hits = calculateTimeSigHits(layout);
    expect(hits[0]?.width).toBe(0);
  });
});

describe('findTimeSigHitAt', () => {
  it('영역 내부 좌표는 hit 반환', () => {
    const hits = calculateTimeSigHits(makeLayout());
    const h = findTimeSigHitAt(hits, 75, 30);
    expect(h?.systemIndex).toBe(0);
  });

  it('영역 외부 좌표는 null', () => {
    const hits = calculateTimeSigHits(makeLayout());
    expect(findTimeSigHitAt(hits, 10, 30)).toBeNull(); // x 너무 작음
    expect(findTimeSigHitAt(hits, 100, 30)).toBeNull(); // x 너무 큼
    expect(findTimeSigHitAt(hits, 75, 5)).toBeNull(); // y 너무 작음
    expect(findTimeSigHitAt(hits, 75, 55)).toBeNull(); // y 너무 큼
  });

  it('경계 좌표는 hit', () => {
    const hits = calculateTimeSigHits(makeLayout());
    expect(findTimeSigHitAt(hits, 60, 10)).not.toBeNull();
    expect(findTimeSigHitAt(hits, 90, 50)).not.toBeNull();
  });
});
