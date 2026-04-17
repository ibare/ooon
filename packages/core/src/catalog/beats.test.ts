import { describe, expect, it } from 'vitest';
import { BEAT_CATALOG } from './beats.js';

describe('BEAT_CATALOG', () => {
  it('contains 6 preset patterns', () => {
    expect(Object.keys(BEAT_CATALOG).length).toBe(6);
  });

  it('every pattern has resolution and tracks', () => {
    for (const [id, pattern] of Object.entries(BEAT_CATALOG)) {
      expect(pattern.resolution, id).toBeGreaterThan(0);
      expect(Object.keys(pattern.tracks).length, id).toBeGreaterThan(0);
    }
  });

  it('each track string length matches resolution', () => {
    for (const [id, pattern] of Object.entries(BEAT_CATALOG)) {
      for (const [track, cells] of Object.entries(pattern.tracks)) {
        expect(cells.length, `${id}.${track}`).toBe(pattern.resolution);
      }
    }
  });

  it('tracks only use x or - characters', () => {
    for (const pattern of Object.values(BEAT_CATALOG)) {
      for (const cells of Object.values(pattern.tracks)) {
        expect(/^[x-]+$/.test(cells)).toBe(true);
      }
    }
  });

  it('8beat-rock has correct kick pattern', () => {
    expect(BEAT_CATALOG['8beat-rock']?.tracks['KK']).toBe('x-------x-x-----');
  });
});
