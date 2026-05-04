import { describe, expect, it } from 'vitest';
import type { NoteEvent } from '@oon/core';
import { resolveAccidentals } from './accidentals.js';
import { parseKeySignature } from './key-signature.js';

function note(pitch: string): NoteEvent {
  return { pitches: [pitch], duration: 'q', beats: 1, isRest: false };
}

function chord(pitches: string[]): NoteEvent {
  return { pitches, duration: 'q', beats: 1, isRest: false };
}

function rest(): NoteEvent {
  return { pitches: [], duration: 'q', beats: 1, isRest: true };
}

describe('resolveAccidentals', () => {
  const C_MAJOR = parseKeySignature('C');

  it('C major에서 첫 등장 #는 sharp 글리프', () => {
    const out = resolveAccidentals([note('A#4')], C_MAJOR);
    expect(out[0]?.kinds[0]).toBe('sharp');
  });

  it('C major에서 같은 letter+octave가 같은 alteration으로 다시 등장하면 글리프 없음', () => {
    const out = resolveAccidentals([note('A#4'), note('A#4')], C_MAJOR);
    expect(out[0]?.kinds[0]).toBe('sharp');
    expect(out[1]?.kinds[0]).toBeNull();
  });

  it('C major에서 A#4 다음 A4는 natural 글리프', () => {
    const out = resolveAccidentals([note('A#4'), note('A4')], C_MAJOR);
    expect(out[0]?.kinds[0]).toBe('sharp');
    expect(out[1]?.kinds[0]).toBe('natural');
  });

  it('A4 다음 A#4는 sharp 글리프 (carry 갱신)', () => {
    const out = resolveAccidentals([note('A4'), note('A#4')], C_MAJOR);
    expect(out[0]?.kinds[0]).toBeNull();
    expect(out[1]?.kinds[0]).toBe('sharp');
  });

  it('octave가 다르면 별개 슬롯', () => {
    const out = resolveAccidentals([note('A#4'), note('A5')], C_MAJOR);
    expect(out[0]?.kinds[0]).toBe('sharp');
    expect(out[1]?.kinds[0]).toBeNull();
  });

  it('rest는 상태에 영향을 주지 않는다', () => {
    const out = resolveAccidentals([note('A#4'), rest(), note('A#4')], C_MAJOR);
    expect(out[1]?.kinds).toEqual([]);
    expect(out[2]?.kinds[0]).toBeNull();
  });

  it('chord: 각 pitch에 대해 kinds 항목 1개씩, letter+octave carry-over는 화음 안에서도 적용', () => {
    // F#4가 먼저 등장 → sharp. 같은 화음에 F#4 다시 → 같은 슬롯이라 두 번째는 null로 나와야 한다.
    const out = resolveAccidentals([chord(['C4', 'F#4', 'F#4'])], C_MAJOR);
    expect(out[0]?.kinds).toEqual([null, 'sharp', null]);
  });

  it('chord: 화음 안 octave가 다르면 별개 슬롯', () => {
    const out = resolveAccidentals([chord(['F#4', 'F#5'])], C_MAJOR);
    expect(out[0]?.kinds).toEqual(['sharp', 'sharp']);
  });

  it('chord: 화음 다음 단음에서도 carry-over가 살아있다', () => {
    const out = resolveAccidentals([chord(['C4', 'F#4']), note('F4')], C_MAJOR);
    expect(out[0]?.kinds).toEqual([null, 'sharp']);
    expect(out[1]?.kinds[0]).toBe('natural');
  });

  it('G major에서 F#4는 임시표 글리프 없음(키 시그니처)', () => {
    const out = resolveAccidentals([note('F#4')], parseKeySignature('G'));
    expect(out[0]?.kinds[0]).toBeNull();
  });

  it('G major에서 F4는 natural 글리프(키 시그니처 무효화)', () => {
    const out = resolveAccidentals([note('F4')], parseKeySignature('G'));
    expect(out[0]?.kinds[0]).toBe('natural');
  });

  it('F major에서 B4는 natural 글리프', () => {
    const out = resolveAccidentals([note('B4')], parseKeySignature('F'));
    expect(out[0]?.kinds[0]).toBe('natural');
  });

  it('F major에서 Bb4는 임시표 없음', () => {
    const out = resolveAccidentals([note('Bb4')], parseKeySignature('F'));
    expect(out[0]?.kinds[0]).toBeNull();
  });

  it('더블 샤프/플랫도 인식', () => {
    const out = resolveAccidentals([note('F##4'), note('Bbb4')], C_MAJOR);
    expect(out[0]?.kinds[0]).toBe('doubleSharp');
    expect(out[1]?.kinds[0]).toBe('doubleFlat');
  });
});
