import { describe, expect, it } from 'vitest';
import { parseChordSymbol } from '@ooon/core';
import { chooseChordVoicingMidis } from './voicing.js';

function voicing(symbol: string, beats = 4): number[] {
  const c = parseChordSymbol(symbol);
  return chooseChordVoicingMidis({ ...c, beats });
}

describe('chooseChordVoicingMidis', () => {
  it('C major → C3/E3/G3', () => {
    expect(voicing('C')).toEqual([48, 52, 55]);
  });

  it('G major → G3/B3/D4', () => {
    expect(voicing('G')).toEqual([55, 59, 62]);
  });

  it('F major → F3/A3/C4', () => {
    expect(voicing('F')).toEqual([53, 57, 60]);
  });

  it('Am → A3/C4/E4', () => {
    expect(voicing('Am')).toEqual([57, 60, 64]);
  });

  it('B major → B3/D#4/F#4 (highest root in C3..B3 octave)', () => {
    // B pc=11 → root MIDI 59 (B3). intervals [0,4,7] → 59/63/66
    expect(voicing('B')).toEqual([59, 63, 66]);
  });
});
