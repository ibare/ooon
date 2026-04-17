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
