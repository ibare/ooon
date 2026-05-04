import { describe, expect, it } from 'vitest';
import {
  midiToFrequency,
  midiToPitch,
  noteName,
  parsePitch,
  pitchClassOf,
  pitchToFrequency,
  pitchToMidi,
  NoteParseError,
  stepPitch,
  transposePitch,
} from './notes.js';

describe('parsePitch', () => {
  it('parses natural notes with octave', () => {
    const p = parsePitch('A4');
    expect(p).toEqual({ letter: 'A', accidental: 0, octave: 4, pitchClass: 9 });
  });

  it('parses sharp and flat', () => {
    expect(parsePitch('C#4').pitchClass).toBe(1);
    expect(parsePitch('Db4').pitchClass).toBe(1);
    expect(parsePitch('Gb4').pitchClass).toBe(6);
    expect(parsePitch('F#4').pitchClass).toBe(6);
  });

  it('defaults octave to 4 when omitted', () => {
    expect(parsePitch('A').octave).toBe(4);
  });

  it('parses double accidentals', () => {
    expect(parsePitch('C##').pitchClass).toBe(2);
    expect(parsePitch('Dbb').pitchClass).toBe(0);
  });

  it('throws on invalid input', () => {
    expect(() => parsePitch('H')).toThrow(NoteParseError);
    expect(() => parsePitch('')).toThrow(NoteParseError);
    expect(() => parsePitch('z')).toThrow(NoteParseError);
  });
});

describe('pitchToMidi and midiToPitch', () => {
  it('middle C is MIDI 60', () => {
    expect(pitchToMidi('C4')).toBe(60);
  });

  it('A4 is MIDI 69', () => {
    expect(pitchToMidi('A4')).toBe(69);
  });

  it('A0 is MIDI 21, C8 is MIDI 108', () => {
    expect(pitchToMidi('A0')).toBe(21);
    expect(pitchToMidi('C8')).toBe(108);
  });

  it('sharps and flats map correctly', () => {
    expect(pitchToMidi('C#4')).toBe(61);
    expect(pitchToMidi('Db4')).toBe(61);
    expect(pitchToMidi('Bb3')).toBe(58);
  });

  it('roundtrips natural notes via sharp naming', () => {
    expect(midiToPitch(60)).toBe('C4');
    expect(midiToPitch(69)).toBe('A4');
    expect(midiToPitch(61)).toBe('C#4');
    expect(midiToPitch(61, true)).toBe('Db4');
  });
});

describe('frequencies', () => {
  it('A4 = 440 Hz', () => {
    expect(pitchToFrequency('A4')).toBeCloseTo(440, 6);
  });

  it('A5 = 880 Hz, A3 = 220 Hz', () => {
    expect(pitchToFrequency('A5')).toBeCloseTo(880, 6);
    expect(pitchToFrequency('A3')).toBeCloseTo(220, 6);
  });

  it('midiToFrequency matches pitchToFrequency', () => {
    expect(midiToFrequency(69)).toBeCloseTo(440, 6);
    expect(midiToFrequency(60)).toBeCloseTo(261.625565, 4);
  });
});

describe('noteName and pitchClassOf', () => {
  it('returns sharp-based names by default', () => {
    expect(noteName(0)).toBe('C');
    expect(noteName(1)).toBe('C#');
    expect(noteName(11)).toBe('B');
  });

  it('returns flat-based names when requested', () => {
    expect(noteName(1, true)).toBe('Db');
    expect(noteName(10, true)).toBe('Bb');
  });

  it('pitchClassOf ignores octave', () => {
    expect(pitchClassOf('A3')).toBe(9);
    expect(pitchClassOf('A5')).toBe(9);
  });
});

describe('transposePitch', () => {
  it('shifts by semitones', () => {
    expect(transposePitch('C4', 7)).toBe('G4');
    expect(transposePitch('C4', 12)).toBe('C5');
    expect(transposePitch('C4', -1)).toBe('B3');
  });

  it('uses flats when requested', () => {
    expect(transposePitch('C4', 1, true)).toBe('Db4');
  });
});

describe('stepPitch — ↑은 ♯ 우선, ↓은 ♭ 우선 (Oon UI 정책)', () => {
  it('자연음 ↑ 반복: C → C♯ → D → D♯ → E → F → F♯ → G → G♯ → A → A♯ → B → C5', () => {
    const seq = ['C4'];
    for (let i = 0; i < 12; i += 1) {
      seq.push(stepPitch(seq[seq.length - 1]!, 'up'));
    }
    expect(seq).toEqual([
      'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5',
    ]);
  });

  it('자연음 ↓ 반복: C5 → B → B♭ → A → A♭ → G → G♭ → F → E → E♭ → D → D♭ → C4', () => {
    const seq = ['C5'];
    for (let i = 0; i < 12; i += 1) {
      seq.push(stepPitch(seq[seq.length - 1]!, 'down'));
    }
    expect(seq).toEqual([
      'C5', 'B4', 'Bb4', 'A4', 'Ab4', 'G4', 'Gb4', 'F4', 'E4', 'Eb4', 'D4', 'Db4', 'C4',
    ]);
  });

  it('E↔F, B↔C 자연 반음은 임시표 없이 위치만 이동(E♯/B♯/F♭/C♭ 금지)', () => {
    expect(stepPitch('E4', 'up')).toBe('F4');
    expect(stepPitch('B4', 'up')).toBe('C5');
    expect(stepPitch('F4', 'down')).toBe('E4');
    expect(stepPitch('C4', 'down')).toBe('B3');
  });

  it('시작이 ♯이고 ↓: 임시표 풀림 (D♯ + ↓ = D)', () => {
    expect(stepPitch('D#4', 'down')).toBe('D4');
    expect(stepPitch('G#4', 'down')).toBe('G4');
  });

  it('시작이 ♭이고 ↑: 임시표 풀림 (D♭ + ↑ = D)', () => {
    expect(stepPitch('Db4', 'up')).toBe('D4');
    expect(stepPitch('Ab4', 'up')).toBe('A4');
  });

  it('시작이 ♯이고 ↑: 한 단계 위 자연음 (D♯ + ↑ = E)', () => {
    expect(stepPitch('D#4', 'up')).toBe('E4');
    expect(stepPitch('A#4', 'up')).toBe('B4');
  });

  it('시작이 ♭이고 ↓: 한 단계 아래로 새 ♭ (D♭ + ↓ = C, A♭ + ↓ = G)', () => {
    expect(stepPitch('Db4', 'down')).toBe('C4');
    expect(stepPitch('Ab4', 'down')).toBe('G4');
  });

  it('octave wrap: B4 + ↑ = C5, C4 + ↓ = B3', () => {
    expect(stepPitch('B4', 'up')).toBe('C5');
    expect(stepPitch('C4', 'down')).toBe('B3');
  });
});
