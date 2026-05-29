import { describe, expect, it, vi } from 'vitest';
import type { AudioEngine } from '@ooon/shared';
import { playSource } from './playback.js';

function createMockEngine(): AudioEngine {
  return {
    init: vi.fn(async () => undefined),
    isReady: () => true,
    playNote: vi.fn(),
    playChord: vi.fn(),
    playDrum: vi.fn(),
    now: () => 0,
    scheduleAt: vi.fn(),
    dispose: vi.fn(),
  };
}

describe('playSource', () => {
  it('잘못된 소스 문자열은 EMPTY 핸들을 반환한다', () => {
    const engine = createMockEngine();
    const handle = playSource(engine, '!!! not a valid block');
    expect(handle.durationSec).toBe(0);
    expect(() => handle.stop()).not.toThrow();
  });

  it('fretboard 1회 strum: 양수 duration + stop 가능', () => {
    const engine = createMockEngine();
    const handle = playSource(engine, 'fretboard C major frets:0-5');
    expect(handle.durationSec).toBeGreaterThan(0);
    expect(() => handle.stop()).not.toThrow();
  });

  it('song에는 setMute 메서드가 노출된다', () => {
    const engine = createMockEngine();
    const source = 'song 4/4 key:C\n  C | G |\n  C4/w | D4/w |';
    const handle = playSource(engine, source);
    expect(typeof handle.setMute).toBe('function');
    expect(() => handle.setMute?.({ chord: true })).not.toThrow();
    handle.stop();
  });

  it('fretboard는 setMute 미노출(song 한정)', () => {
    const engine = createMockEngine();
    const handle = playSource(engine, 'fretboard C major frets:0-5');
    expect(handle.setMute).toBeUndefined();
    handle.stop();
  });
});
