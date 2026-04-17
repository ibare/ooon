import { describe, expect, it } from 'vitest';
import { PROGRESSION_CATALOG, findProgression } from './progressions.js';

describe('PROGRESSION_CATALOG', () => {
  it('contains 10 preset progressions', () => {
    expect(PROGRESSION_CATALOG.length).toBe(10);
  });

  it('every entry has required fields', () => {
    for (const p of PROGRESSION_CATALOG) {
      expect(p.id).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(['major', 'minor']).toContain(p.mode);
      expect(p.romans.length).toBeGreaterThan(0);
      expect(p.description).toBeTruthy();
    }
  });

  it('all ids are unique', () => {
    const ids = PROGRESSION_CATALOG.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('findProgression resolves by id', () => {
    const p = findProgression('pop-1564');
    expect(p?.romans).toEqual(['I', 'V', 'vi', 'IV']);
  });

  it('findProgression returns undefined for unknown id', () => {
    expect(findProgression('does-not-exist')).toBeUndefined();
  });

  it('includes classic progressions', () => {
    const ids = PROGRESSION_CATALOG.map((p) => p.id);
    expect(ids).toContain('pop-1564');
    expect(ids).toContain('jazz-251');
    expect(ids).toContain('pachelbel');
    expect(ids).toContain('andalusian');
  });
});
