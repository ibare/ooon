import { describe, expect, it, vi } from 'vitest';
import type { AudioEngine } from '@oon/shared';
import { OonRuntime } from './runtime.js';

function createFakeAudioEngine(): AudioEngine & { readonly log: string[] } {
  const log: string[] = [];
  let ready = false;
  return {
    log,
    init: vi.fn(async () => {
      log.push('init');
      ready = true;
    }),
    isReady: () => ready,
    playNote: (p, d, t) => {
      log.push(`note:${p}:${d}:${t ?? ''}`);
    },
    playChord: (ps, d, t) => {
      log.push(`chord:${ps.join(',')}:${d}:${t ?? ''}`);
    },
    playDrum: (sample) => {
      log.push(`drum:${sample}`);
    },
    now: () => 0,
    scheduleAt: (_t, cb) => cb(),
    dispose: vi.fn(() => {
      log.push('dispose');
      ready = false;
    }),
  };
}

describe('OonRuntime', () => {
  it('does not create audio engine until requested', () => {
    const factory = vi.fn(() => createFakeAudioEngine());
    const runtime = new OonRuntime({ createAudioEngine: factory });
    expect(runtime.hasAudioEngine()).toBe(false);
    expect(factory).not.toHaveBeenCalled();
  });

  it('initializes audio engine on first getAudioEngine() call', async () => {
    const fake = createFakeAudioEngine();
    const runtime = new OonRuntime({ createAudioEngine: () => fake });
    const engine = await runtime.getAudioEngine();
    expect(engine).toBe(fake);
    expect(fake.log).toEqual(['init']);
    expect(runtime.hasAudioEngine()).toBe(true);
  });

  it('reuses the audio engine across subsequent calls without re-initializing', async () => {
    const fake = createFakeAudioEngine();
    const factory = vi.fn(() => fake);
    const runtime = new OonRuntime({ createAudioEngine: factory });
    await runtime.getAudioEngine();
    await runtime.getAudioEngine();
    expect(factory).toHaveBeenCalledTimes(1);
    expect(fake.log.filter((l) => l === 'init')).toHaveLength(1);
  });

  it('dispose() tears down audio engine and clears state', async () => {
    const fake = createFakeAudioEngine();
    const runtime = new OonRuntime({ createAudioEngine: () => fake });
    await runtime.getAudioEngine();
    runtime.dispose();
    expect(fake.log).toContain('dispose');
    expect(runtime.hasAudioEngine()).toBe(false);
  });

  it('loadFont() resolves immediately when no URL is configured', async () => {
    const runtime = new OonRuntime();
    await expect(runtime.loadFont()).resolves.toBeUndefined();
  });
});
