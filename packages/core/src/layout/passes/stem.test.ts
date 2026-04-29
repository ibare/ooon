import { describe, expect, it } from 'vitest';
import { GLYPHS } from '@oon/smufl-asset';
import { placeStem, stemDirection } from './stem.js';

const B4_STEP = 4 * 7 + 6;

describe('stemDirection', () => {
  it('B4(이상)는 down', () => {
    expect(stemDirection(B4_STEP, B4_STEP)).toBe('down');
    expect(stemDirection(B4_STEP + 5, B4_STEP)).toBe('down');
  });

  it('B4 미만은 up', () => {
    expect(stemDirection(B4_STEP - 1, B4_STEP)).toBe('up');
  });
});

describe('placeStem', () => {
  const ctx = { pxPerSp: 10, stemLengthSp: 3.5 };

  it('up일 때 stemUpSE 앵커에서 시작, 위로 3.5 sp 길이', () => {
    const noteX = 100;
    const noteY = 50;
    const p = placeStem('noteheadBlack', noteX, noteY, 'up', ctx);
    const a = GLYPHS.noteheadBlack.anchors.stemUpSE;
    expect(a).toBeDefined();
    if (!a) return;
    expect(p.x).toBeCloseTo(noteX + a.x * ctx.pxPerSp, 6);
    // SMuFL y up → 화면 y down: y1 = noteY - a.y * pxPerSp
    expect(p.y1).toBeCloseTo(noteY - a.y * ctx.pxPerSp, 6);
    expect(p.y2).toBeCloseTo(p.y1 - 3.5 * ctx.pxPerSp, 6);
    expect(p.direction).toBe('up');
  });

  it('down일 때 stemDownNW 앵커에서 시작, 아래로 3.5 sp 길이', () => {
    const noteX = 100;
    const noteY = 50;
    const p = placeStem('noteheadBlack', noteX, noteY, 'down', ctx);
    const a = GLYPHS.noteheadBlack.anchors.stemDownNW;
    expect(a).toBeDefined();
    if (!a) return;
    expect(p.x).toBeCloseTo(noteX + a.x * ctx.pxPerSp, 6);
    expect(p.y1).toBeCloseTo(noteY - a.y * ctx.pxPerSp, 6);
    expect(p.y2).toBeCloseTo(p.y1 + 3.5 * ctx.pxPerSp, 6);
    expect(p.direction).toBe('down');
  });

  it('half note도 stem 앵커가 있다', () => {
    const p = placeStem('noteheadHalf', 0, 0, 'up', ctx);
    expect(p.x).not.toBeNaN();
    expect(p.y1).not.toBeNaN();
  });
});
