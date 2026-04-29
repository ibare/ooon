import { describe, expect, it } from 'vitest';
import type { NoteEvent } from '../../ast/types.js';
import { resolveAccidentals } from './accidentals.js';
import { parseKeySignature } from './key-signature.js';

function note(pitch: string): NoteEvent {
  return { pitch, duration: 'q', beats: 1, isRest: false };
}

function rest(): NoteEvent {
  return { pitch: '', duration: 'q', beats: 1, isRest: true };
}

describe('resolveAccidentals', () => {
  const C_MAJOR = parseKeySignature('C');

  it('C major에서 첫 등장 #는 sharp 글리프', () => {
    const out = resolveAccidentals([note('A#4')], C_MAJOR);
    expect(out[0]?.kind).toBe('sharp');
  });

  it('C major에서 같은 letter+octave가 같은 alteration으로 다시 등장하면 글리프 없음', () => {
    const out = resolveAccidentals([note('A#4'), note('A#4')], C_MAJOR);
    expect(out[0]?.kind).toBe('sharp');
    expect(out[1]?.kind).toBeNull();
  });

  it('C major에서 A#4 다음 A4는 natural 글리프', () => {
    const out = resolveAccidentals([note('A#4'), note('A4')], C_MAJOR);
    expect(out[0]?.kind).toBe('sharp');
    expect(out[1]?.kind).toBe('natural');
  });

  it('A4 다음 A#4는 sharp 글리프 (carry 갱신)', () => {
    const out = resolveAccidentals([note('A4'), note('A#4')], C_MAJOR);
    expect(out[0]?.kind).toBeNull();
    expect(out[1]?.kind).toBe('sharp');
  });

  it('octave가 다르면 별개 슬롯', () => {
    const out = resolveAccidentals([note('A#4'), note('A5')], C_MAJOR);
    expect(out[0]?.kind).toBe('sharp');
    expect(out[1]?.kind).toBeNull();
  });

  it('rest는 상태에 영향을 주지 않는다', () => {
    const out = resolveAccidentals([note('A#4'), rest(), note('A#4')], C_MAJOR);
    expect(out[1]?.kind).toBeNull();
    expect(out[2]?.kind).toBeNull();
  });

  it('G major에서 F#4는 임시표 글리프 없음(키 시그니처)', () => {
    const out = resolveAccidentals([note('F#4')], parseKeySignature('G'));
    expect(out[0]?.kind).toBeNull();
  });

  it('G major에서 F4는 natural 글리프(키 시그니처 무효화)', () => {
    const out = resolveAccidentals([note('F4')], parseKeySignature('G'));
    expect(out[0]?.kind).toBe('natural');
  });

  it('F major에서 B4는 natural 글리프', () => {
    const out = resolveAccidentals([note('B4')], parseKeySignature('F'));
    expect(out[0]?.kind).toBe('natural');
  });

  it('F major에서 Bb4는 임시표 없음', () => {
    const out = resolveAccidentals([note('Bb4')], parseKeySignature('F'));
    expect(out[0]?.kind).toBeNull();
  });

  it('더블 샤프/플랫도 인식', () => {
    const out = resolveAccidentals([note('F##4'), note('Bbb4')], C_MAJOR);
    expect(out[0]?.kind).toBe('doubleSharp');
    expect(out[1]?.kind).toBe('doubleFlat');
  });
});
