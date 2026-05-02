import { describe, expect, it } from 'vitest';
import { parseBlock, type ScoreNode } from '@oon/core';
import { calculateScoreLayout } from './score-layout.js';

function parseScore(dsl: string): ScoreNode {
  const n = parseBlock(dsl);
  if (n.type !== 'score') throw new Error('expected score');
  return n;
}

describe('calculateScoreLayout', () => {
  it('returns staff, clef, time sig and bars', () => {
    const node = parseScore('score 4/4\n  A4/q B4/q C5/q D5/q |');
    const layout = calculateScoreLayout(node, { width: 400 });
    expect(layout.width).toBe(400);
    expect(layout.systems[0]!.staff.lines.length).toBe(5);
    expect(layout.systems[0]!.clef.glyph).toBeTruthy();
    expect(layout.systems[0]!.timeSig.topGlyph).toBeTruthy();
    expect(layout.systems[0]!.bars.length).toBe(1);
    expect(layout.systems[0]!.bars[0]?.notes.length).toBe(4);
  });

  it('단일 시스템: 모든 마디 폭 동일·연속, 컨테이너를 가득 채우지 않는다(자연 폭 좌측 정렬)', () => {
    // width=800은 4/4 2마디가 단일 시스템에 들어갈 만한 폭. 자연 폭 좌측 정렬이라
    // 우측에 여백이 남는다(컨테이너를 가득 채우지 않음).
    const node = parseScore('score 4/4\n  A4/w | A4/w |');
    const layout = calculateScoreLayout(node, { width: 800 });
    expect(layout.systems.length).toBe(1);
    expect(layout.systems[0]!.bars.length).toBe(2);
    const b0 = layout.systems[0]!.bars[0]!;
    const b1 = layout.systems[0]!.bars[1]!;
    expect(b0.width).toBeCloseTo(b1.width, 2);
    expect(b1.x).toBeCloseTo(b0.x + b0.width, 2);
    expect(b1.barlineX).toBeLessThan(800);
  });

  it('places B4 on middle staff line (y = centerY)', () => {
    const node = parseScore('score 4/4\n  B4/w |');
    const layout = calculateScoreLayout(node, { width: 400, staffY: 40, lineGap: 10 });
    const note = layout.systems[0]!.bars[0]?.notes[0];
    expect(note?.y).toBeCloseTo(layout.systems[0]!.staff.y, 2);
  });

  it('places notes above/below staff with ledger lines', () => {
    const node = parseScore('score 4/4\n  C4/w |');
    const layout = calculateScoreLayout(node, { width: 400, staffY: 40, lineGap: 10 });
    const note = layout.systems[0]!.bars[0]?.notes[0];
    expect(note?.y).toBeGreaterThan(layout.systems[0]!.staff.bottom);
    expect(note?.ledgerLines.length).toBeGreaterThanOrEqual(1);
  });

  it('rests have isRest true and no pitch', () => {
    const node = parseScore('score 4/4\n  r/q A4/q r/h |');
    const layout = calculateScoreLayout(node, { width: 400 });
    const n0 = layout.systems[0]!.bars[0]?.notes[0];
    const n2 = layout.systems[0]!.bars[0]?.notes[2];
    expect(n0?.isRest).toBe(true);
    expect(n0?.pitch).toBe('');
    expect(n2?.isRest).toBe(true);
  });

  it('stems point down for notes above B4, up for notes below', () => {
    const node = parseScore('score 4/4\n  E4/q A4/q C5/q F5/q |');
    const layout = calculateScoreLayout(node, { width: 400 });
    const notes = layout.systems[0]!.bars[0]?.notes ?? [];
    expect(notes[0]?.stem).toBeDefined();
    expect(notes[3]?.stem).toBeDefined();
    const e4 = notes[0];
    const f5 = notes[3];
    if (e4?.stem && f5?.stem) {
      expect(e4.stem.y2).toBeLessThan(e4.stem.y1);
      expect(f5.stem.y2).toBeGreaterThan(f5.stem.y1);
    }
  });

  it('whole notes have no stem', () => {
    const node = parseScore('score 4/4\n  A4/w |');
    const layout = calculateScoreLayout(node, { width: 400 });
    expect(layout.systems[0]!.bars[0]?.notes[0]?.stem).toBeUndefined();
  });

  it('a standalone eighth note has a flag glyph (not beamed)', () => {
    // 단독 8분음표(앞뒤가 q/h 등 빔 불가 음가)는 flag을 가진다.
    const node = parseScore('score 4/4\n  A4/e A4/q A4/q A4/q A4/e |');
    const layout = calculateScoreLayout(node, { width: 400 });
    const n0 = layout.systems[0]!.bars[0]?.notes[0];
    expect(n0?.flag).toBeDefined();
  });

  it('accidentals produce glyphs and apply carry-over within a bar', () => {
    // C major. A#4 다음 A4는 ♮ 글리프, 그 다음 A4는 carry되어 글리프 없음.
    const node = parseScore('score 4/4\n  A#4/q Bb4/q A4/q A4/q |');
    const layout = calculateScoreLayout(node, { width: 400 });
    const notes = layout.systems[0]!.bars[0]?.notes ?? [];
    expect(notes[0]?.accidental).toBeDefined();
    expect(notes[1]?.accidental).toBeDefined();
    expect(notes[2]?.accidental).toBeDefined(); // natural
    expect(notes[3]?.accidental).toBeUndefined();
  });

  it('다중 시스템(uniform grid): 모든 줄 동일 N개 마디(마지막 줄만 남는 만큼), 모든 마디 폭 동일', () => {
    // 좁은 컨테이너에서 12마디 → 줄바꿈 발생. uniform grid 정책으로 각 줄의 마디 수와
    // 폭이 동일하고, 마지막 줄만 남는 개수만큼만 그려진다.
    const node = parseScore(
      'score 4/4\n  A4/w | A4/w | A4/w | A4/w | A4/w | A4/w | A4/w | A4/w | A4/w | A4/w | A4/w | A4/w |',
    );
    const layout = calculateScoreLayout(node, { width: 600 });
    expect(layout.systems.length).toBeGreaterThanOrEqual(2);

    const firstWidth = layout.systems[0]!.bars[0]!.width;
    // 모든 시스템·마디의 폭이 동일.
    for (const sys of layout.systems) {
      for (const bar of sys.bars) {
        expect(bar.width).toBeCloseTo(firstWidth, 2);
      }
    }

    // 마지막 줄을 제외한 모든 줄의 마디 수가 같다.
    const fullCount = layout.systems[0]!.bars.length;
    for (let i = 0; i < layout.systems.length - 1; i += 1) {
      expect(layout.systems[i]!.bars.length).toBe(fullCount);
    }
    expect(layout.systems[layout.systems.length - 1]!.bars.length).toBeLessThanOrEqual(fullCount);
  });

  it('uniform grid 정렬: 모든 줄의 i번째 마디 시작 x가 동일(수직 정렬)', () => {
    const node = parseScore(
      'score 4/4\n  A4/w | A4/w | A4/w | A4/w | A4/w | A4/w | A4/w | A4/w | A4/w |',
    );
    const layout = calculateScoreLayout(node, { width: 500 });
    expect(layout.systems.length).toBeGreaterThanOrEqual(2);
    const firstSystemBars = layout.systems[0]!.bars;
    for (let s = 1; s < layout.systems.length; s += 1) {
      const sys = layout.systems[s]!;
      for (let b = 0; b < sys.bars.length; b += 1) {
        expect(sys.bars[b]!.x).toBeCloseTo(firstSystemBars[b]!.x, 2);
        expect(sys.bars[b]!.barlineX).toBeCloseTo(firstSystemBars[b]!.barlineX, 2);
      }
    }
  });

  it('박자 격자 정렬: 단일 4분음표는 박자 0 슬롯 시작에 위치하고, 4개는 등간격', () => {
    // distributeNotesByBeat에서 첫 음표 offset=0 이므로 x = innerX(박자 0 슬롯 시작).
    // leadingShift 제거 후, q 1개와 q 4개의 첫 음표 x가 같아야 격자 정렬이 성립.
    const node1 = parseScore('score 4/4\n  A4/q |');
    const layout1 = calculateScoreLayout(node1, { width: 400 });
    const x1 = layout1.systems[0]!.bars[0]!.notes[0]!.x;

    const node4 = parseScore('score 4/4\n  A4/q A4/q A4/q A4/q |');
    const layout4 = calculateScoreLayout(node4, { width: 400 });
    const xs = layout4.systems[0]!.bars[0]!.notes.map((n) => n.x);

    expect(xs[0]).toBeCloseTo(x1, 4);
    const d01 = xs[1]! - xs[0]!;
    const d12 = xs[2]! - xs[1]!;
    const d23 = xs[3]! - xs[2]!;
    expect(d01).toBeCloseTo(d12, 4);
    expect(d12).toBeCloseTo(d23, 4);
  });

  it('lays out a header-only score as a single empty bar (no notes)', () => {
    const node = parseScore('score 4/4');
    const layout = calculateScoreLayout(node, { width: 400 });
    expect(layout.systems.length).toBe(1);
    expect(layout.systems[0]!.bars.length).toBe(1);
    expect(layout.systems[0]!.bars[0]?.notes.length).toBe(0);
    expect(layout.systems[0]!.staff.lines.length).toBe(5);
    expect(layout.systems[0]!.timeSig.topGlyph).toBeTruthy();
  });
});
