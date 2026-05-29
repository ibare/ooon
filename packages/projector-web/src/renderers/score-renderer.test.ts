import { describe, expect, it } from 'vitest';
import { parseBlock } from '@ooon/core';
import type { ScoreNode } from '@ooon/core';
import { calculateScoreLayout } from '@ooon/score-engraving';
import { renderScore } from './score-renderer.js';
import { FakeProjector } from '../testing/fake-projector.js';

function parseScore(dsl: string): ScoreNode {
  const n = parseBlock(dsl);
  if (n.type !== 'score') throw new Error('expected score');
  return n;
}

describe('renderScore', () => {
  it('draws 5 staff lines', () => {
    const node = parseScore('score 4/4\n  A4/q B4/q C5/q D5/q |');
    const layout = calculateScoreLayout(node, { width: 400 });
    const projector = new FakeProjector();
    renderScore(projector, layout);
    const lineCalls = projector.callsOf('drawLine');
    expect(lineCalls.length).toBeGreaterThanOrEqual(5);
  });

  it('draws clef and time signature glyphs', () => {
    const node = parseScore('score 4/4\n  A4/q |');
    const layout = calculateScoreLayout(node, { width: 400 });
    const projector = new FakeProjector();
    renderScore(projector, layout);
    const texts = projector.texts();
    expect(texts).toContain(layout.systems[0]!.clef.glyph);
    expect(texts).toContain(layout.systems[0]!.timeSig.topGlyph);
    expect(texts).toContain(layout.systems[0]!.timeSig.bottomGlyph);
  });

  it('registers hit areas for non-rest notes only', () => {
    const node = parseScore('score 4/4\n  A4/q r/q A4/q r/q |');
    const layout = calculateScoreLayout(node, { width: 400 });
    const projector = new FakeProjector();
    renderScore(projector, layout);
    const scoreHits = projector.hitAreas.filter((h) => h.id.startsWith('score:'));
    expect(scoreHits.length).toBe(2);
  });

  it('shows note names when showNoteNames option is enabled', () => {
    const node = parseScore('score 4/4\n  A4/q |');
    const layout = calculateScoreLayout(node, { width: 400 });
    const projector = new FakeProjector();
    renderScore(projector, layout, { showNoteNames: true });
    expect(projector.texts()).toContain('A4');
  });
});
