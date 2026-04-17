import type { AudioEngine } from '@oon/shared';
import {
  parseBlock,
  type BlockNode,
  type DrumNode,
  type DrumTrackKey,
  type ProgressionNode,
  type ScoreNode,
  type SongNode,
} from '@oon/core';

export interface PlaybackHandle {
  stop(): void;
  durationSec: number;
}

const EMPTY: PlaybackHandle = { stop() {}, durationSec: 0 };

export function playSource(engine: AudioEngine, source: string): PlaybackHandle {
  let node: BlockNode;
  try {
    node = parseBlock(source);
  } catch {
    return EMPTY;
  }
  switch (node.type) {
    case 'score':
      return playScore(engine, node);
    case 'drum':
      return playDrum(engine, node);
    case 'progression':
      return playProgression(engine, node);
    case 'song':
      return playSong(engine, node);
    case 'fretboard':
      return EMPTY;
  }
}

interface Scheduler {
  schedule(delaySec: number, fn: () => void): void;
  stop(): void;
}

function createScheduler(): Scheduler {
  const ids: number[] = [];
  let cancelled = false;
  return {
    schedule(delaySec, fn) {
      if (cancelled) return;
      const id = window.setTimeout(() => {
        if (!cancelled) fn();
      }, Math.max(0, delaySec * 1000));
      ids.push(id);
    },
    stop() {
      cancelled = true;
      for (const id of ids) window.clearTimeout(id);
      ids.length = 0;
    },
  };
}

function playScore(engine: AudioEngine, node: ScoreNode): PlaybackHandle {
  const scheduler = createScheduler();
  const secPerBeat = 60 / node.bpm;
  let t = 0;
  for (const bar of node.bars) {
    for (const ev of bar.notes) {
      if (!ev.isRest) {
        const pitch = ev.pitch;
        const dur = ev.duration;
        scheduler.schedule(t, () => engine.playNote(pitch, dur));
      }
      t += ev.beats * secPerBeat;
    }
  }
  return { stop: scheduler.stop, durationSec: t };
}

function playDrum(engine: AudioEngine, node: DrumNode): PlaybackHandle {
  const scheduler = createScheduler();
  const secPerBeat = 60 / node.bpm;
  const stepBeats = node.timeSignature.beats / node.resolution;
  const secPerStep = stepBeats * secPerBeat;
  const totalSteps = node.barCount * node.resolution;
  scheduleDrumTracks(engine, scheduler, node.tracks, 0, totalSteps, secPerStep);
  return { stop: scheduler.stop, durationSec: totalSteps * secPerStep };
}

function playProgression(engine: AudioEngine, node: ProgressionNode): PlaybackHandle {
  const scheduler = createScheduler();
  const secPerBeat = 60 / node.bpm;
  let t = 0;
  for (const bar of node.bars) {
    for (const chord of bar.chords) {
      const notes = withOctave(chord.notes, 4);
      const dur = beatsToDurationSymbol(chord.beats);
      scheduler.schedule(t, () => engine.playChord(notes, dur));
      t += chord.beats * secPerBeat;
    }
  }
  return { stop: scheduler.stop, durationSec: t };
}

function playSong(engine: AudioEngine, node: SongNode): PlaybackHandle {
  const scheduler = createScheduler();
  const secPerBeat = 60 / node.bpm;
  const beatsPerBar = node.timeSignature.beats;
  const barSec = beatsPerBar * secPerBeat;
  let t = 0;
  for (const bar of node.bars) {
    const chordNotes = withOctave(bar.chord.notes, 3);
    const chordDur = beatsToDurationSymbol(bar.chord.beats);
    scheduler.schedule(t, () => engine.playChord(chordNotes, chordDur));

    let mt = t;
    for (const ev of bar.melody) {
      if (!ev.isRest) {
        const pitch = ev.pitch;
        const dur = ev.duration;
        scheduler.schedule(mt, () => engine.playNote(pitch, dur));
      }
      mt += ev.beats * secPerBeat;
    }

    if (bar.drum) {
      const cellsPerBar = Math.max(
        0,
        ...Object.values(bar.drum).map((cells) => cells?.length ?? 0),
      );
      if (cellsPerBar > 0) {
        scheduleDrumTracks(engine, scheduler, bar.drum, t, cellsPerBar, barSec / cellsPerBar);
      }
    }

    t += barSec;
  }
  return { stop: scheduler.stop, durationSec: t };
}

function scheduleDrumTracks(
  engine: AudioEngine,
  scheduler: Scheduler,
  tracks: Partial<Record<DrumTrackKey, boolean[]>>,
  offsetSec: number,
  totalSteps: number,
  secPerStep: number,
): void {
  for (const [key, cells] of Object.entries(tracks)) {
    if (!cells) continue;
    const track = key as DrumTrackKey;
    const limit = Math.min(cells.length, totalSteps);
    for (let i = 0; i < limit; i++) {
      if (!cells[i]) continue;
      const at = offsetSec + i * secPerStep;
      scheduler.schedule(at, () => triggerDrum(engine, track));
    }
  }
}

function triggerDrum(engine: AudioEngine, track: DrumTrackKey): void {
  switch (track) {
    case 'KK':
    case 'TM':
      engine.playKick();
      return;
    case 'SN':
      engine.playSnare();
      return;
    case 'HH':
    case 'CR':
    case 'RD':
      engine.playHihat();
      return;
  }
}

function withOctave(notes: readonly string[], octave: number): string[] {
  return notes.map((n) => (/\d$/.test(n) ? n : `${n}${octave}`));
}

function beatsToDurationSymbol(beats: number): string {
  if (beats >= 4) return 'w';
  if (beats >= 2) return 'h';
  if (beats >= 1) return 'q';
  if (beats >= 0.5) return 'e';
  return 's';
}
