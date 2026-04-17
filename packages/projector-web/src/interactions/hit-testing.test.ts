import { describe, expect, it } from 'vitest';
import type { HitArea } from '@oon/shared';
import { hitTest } from './hit-testing.js';

const A: HitArea = { id: 'a', rect: { x: 0, y: 0, width: 10, height: 10 } };
const B: HitArea = { id: 'b', rect: { x: 5, y: 5, width: 10, height: 10 } };

describe('hitTest', () => {
  it('returns undefined when no area is hit', () => {
    expect(hitTest([A, B], { x: 100, y: 100 })).toBeUndefined();
  });

  it('returns the topmost matching area (reverse z-order)', () => {
    const hit = hitTest([A, B], { x: 7, y: 7 });
    expect(hit?.id).toBe('b');
  });

  it('matches edges inclusively', () => {
    expect(hitTest([A], { x: 0, y: 0 })?.id).toBe('a');
    expect(hitTest([A], { x: 10, y: 10 })?.id).toBe('a');
  });

  it('skips empty areas list', () => {
    expect(hitTest([], { x: 0, y: 0 })).toBeUndefined();
  });
});
