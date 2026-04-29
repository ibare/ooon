import { describe, expect, it } from 'vitest';
import { ENGRAVING, GLYPHS } from '@oon/smufl-asset';
import { ledgerLines, noteY } from './vertical.js';

const ctx = {
  centerY: 40,
  staffTopY: 20,
  staffBottomY: 60,
  pxPerSp: 10,
  b4Step: 4 * 7 + 6, // letterStep('B', 4)
};

describe('noteY', () => {
  it('B4(b4Step)는 centerY와 일치', () => {
    expect(noteY(ctx.b4Step, ctx)).toBeCloseTo(40, 6);
  });

  it('한 step 위면 0.5 sp 위로 이동(y가 작아짐)', () => {
    expect(noteY(ctx.b4Step + 1, ctx)).toBeCloseTo(40 - 5, 6);
  });

  it('한 step 아래면 0.5 sp 아래로 이동', () => {
    expect(noteY(ctx.b4Step - 1, ctx)).toBeCloseTo(40 + 5, 6);
  });
});

describe('ledgerLines', () => {
  it('보표 안 음표는 ledger 없음', () => {
    expect(ledgerLines(40, 0, ctx)).toEqual([]);
  });

  it('C4(보표 아래 첫 ledger)는 1개', () => {
    // C4 step = 4*7 + 0 = 28. b4=34. step 차이 6 → 6*0.5=3 sp 아래.
    const yC4 = noteY(4 * 7 + 0, ctx);
    const lines = ledgerLines(yC4, 0, ctx);
    expect(lines.length).toBe(1);
  });

  it('A5(보표 위 첫 ledger)는 1개', () => {
    // A5 step = 5*7 + 5 = 40. b4=34. 차이 -6 → 3 sp 위.
    const yA5 = noteY(5 * 7 + 5, ctx);
    const lines = ledgerLines(yA5, 0, ctx);
    expect(lines.length).toBe(1);
  });

  it('ledger 길이는 노트헤드 폭 + 좌우 legerLineExtension', () => {
    const yC4 = noteY(4 * 7 + 0, ctx);
    const noteX = 50;
    const lines = ledgerLines(yC4, noteX, ctx);
    const headW = GLYPHS.noteheadBlack.advanceWidth * ctx.pxPerSp;
    const ext = ENGRAVING.legerLineExtension * ctx.pxPerSp;
    const ll = lines[0];
    expect(ll).toBeDefined();
    if (!ll) return;
    expect(ll.x1).toBeCloseTo(noteX - ext, 6);
    expect(ll.x2).toBeCloseTo(noteX + headW + ext, 6);
  });
});
