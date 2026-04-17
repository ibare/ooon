import { describe, expect, it } from 'vitest';
import { parseBlock } from './parser.js';

describe('parseDrumBlock', () => {
  it('parses 3-track drum', () => {
    const dsl = `drum 4/4 bpm:100
  HH | x-x-x-x-x-x-x-x- |
  SN | ----x-------x--- |
  KK | x-------x-x----- |`;
    const n = parseBlock(dsl);
    expect(n.type).toBe('drum');
    if (n.type !== 'drum') return;
    expect(n.resolution).toBe(16);
    expect(n.barCount).toBe(1);
    expect(n.tracks.HH?.filter((b) => b).length).toBe(8);
    expect(n.tracks.KK?.filter((b) => b).length).toBe(3);
  });

  it('parses 2-bar drum', () => {
    const dsl = `drum 4/4
  HH | xxxxxxxxxxxxxxxx | xxxxxxxxxxxxxxxx |
  KK | x---x---x---x--- | x---x---x---x--- |`;
    const n = parseBlock(dsl);
    if (n.type !== 'drum') throw new Error('type');
    expect(n.barCount).toBe(2);
    expect(n.tracks.HH?.length).toBe(32);
  });

  it('skips unknown track with warning', () => {
    const dsl = `drum 4/4
  XX | x-x-x-x-x-x-x-x- |`;
    const n = parseBlock(dsl);
    if (n.type !== 'drum') throw new Error('type');
    expect(n.warnings.some((w) => w.includes('unknown'))).toBe(true);
  });
});
