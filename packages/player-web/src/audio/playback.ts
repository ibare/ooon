import type { AudioEngine, DrumSample } from '@oon/shared';
import {
  parseBlock,
  type BlockNode,
  type DrumNode,
  type DrumTrackKey,
  type FretboardNode,
  type ProgressionNode,
  type ScoreNode,
  type SongNode,
} from '@oon/core';

export interface TrackMute {
  chord?: boolean;
  melody?: boolean;
  drum?: boolean;
}

export interface PlaybackHandle {
  stop(): void;
  durationSec: number;
  /** Song 재생에서만 의미. 호출 시점 이후 fire되는 노트에 즉시 반영된다. */
  setMute?(mute: TrackMute): void;
}

export interface PlaySourceOptions {
  mute?: TrackMute;
}

const EMPTY: PlaybackHandle = { stop() {}, durationSec: 0 };

export function playSource(
  engine: AudioEngine,
  source: string | BlockNode,
  opts: PlaySourceOptions = {},
): PlaybackHandle {
  let node: BlockNode;
  if (typeof source === 'string') {
    try {
      node = parseBlock(source);
    } catch {
      return EMPTY;
    }
  } else {
    node = source;
  }
  switch (node.type) {
    case 'score':
      return playScore(engine, node);
    case 'drum':
      return playDrum(engine, node);
    case 'progression':
      return playProgression(engine, node);
    case 'song':
      return playSong(engine, node, opts.mute);
    case 'fretboard':
      return playFretboard(engine, node);
  }
}

interface Scheduler {
  schedule(delaySec: number, fn: () => void): void;
  stop(): void;
}

function createScheduler(): Scheduler {
  const ids: ReturnType<typeof setTimeout>[] = [];
  let cancelled = false;
  return {
    schedule(delaySec, fn) {
      if (cancelled) return;
      const id = setTimeout(() => {
        if (!cancelled) fn();
      }, Math.max(0, delaySec * 1000));
      ids.push(id);
    },
    stop() {
      cancelled = true;
      for (const id of ids) clearTimeout(id);
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

/** Fretboard는 scale.notes를 octave 4 기반으로 60ms 간격 1회 strum. */
const STRUM_GAP_SEC = 0.06;
const STRUM_NOTE_DURATION = 'h';

function playFretboard(engine: AudioEngine, node: FretboardNode): PlaybackHandle {
  const scheduler = createScheduler();
  const notes = withOctave(node.scale.notes, 4);
  if (notes.length === 0) return EMPTY;
  for (let i = 0; i < notes.length; i++) {
    const pitch = notes[i]!;
    scheduler.schedule(i * STRUM_GAP_SEC, () => engine.playNote(pitch, STRUM_NOTE_DURATION));
  }
  const tail = (notes.length - 1) * STRUM_GAP_SEC + 0.5;
  return { stop: scheduler.stop, durationSec: tail };
}

function playSong(
  engine: AudioEngine,
  node: SongNode,
  initialMute: TrackMute | undefined,
): PlaybackHandle {
  const scheduler = createScheduler();
  const secPerBeat = 60 / node.bpm;
  const beatsPerBar = node.timeSignature.beats;
  const barSec = beatsPerBar * secPerBeat;
  let mute: TrackMute = { ...(initialMute ?? {}) };

  let t = 0;
  for (const bar of node.bars) {
    const chordNotes = withOctave(bar.chord.notes, 3);
    const chordDur = beatsToDurationSymbol(bar.chord.beats);
    scheduler.schedule(t, () => {
      if (mute.chord) return;
      engine.playChord(chordNotes, chordDur);
    });

    let mt = t;
    for (const ev of bar.melody) {
      if (!ev.isRest) {
        const pitch = ev.pitch;
        const dur = ev.duration;
        scheduler.schedule(mt, () => {
          if (mute.melody) return;
          engine.playNote(pitch, dur);
        });
      }
      mt += ev.beats * secPerBeat;
    }

    if (bar.drum) {
      const cellsPerBar = Math.max(
        0,
        ...Object.values(bar.drum).map((cells) => cells?.length ?? 0),
      );
      if (cellsPerBar > 0) {
        scheduleDrumTracks(
          engine,
          scheduler,
          bar.drum,
          t,
          cellsPerBar,
          barSec / cellsPerBar,
          () => mute.drum === true,
        );
      }
    }

    t += barSec;
  }
  return {
    stop: scheduler.stop,
    durationSec: t,
    setMute(next) {
      mute = { ...next };
    },
  };
}

function scheduleDrumTracks(
  engine: AudioEngine,
  scheduler: Scheduler,
  tracks: Partial<Record<DrumTrackKey, boolean[]>>,
  offsetSec: number,
  totalSteps: number,
  secPerStep: number,
  isMuted?: () => boolean,
): void {
  for (const [key, cells] of Object.entries(tracks)) {
    if (!cells) continue;
    const track = key as DrumTrackKey;
    const limit = Math.min(cells.length, totalSteps);
    for (let i = 0; i < limit; i++) {
      if (!cells[i]) continue;
      const at = offsetSec + i * secPerStep;
      scheduler.schedule(at, () => {
        if (isMuted?.()) return;
        triggerDrum(engine, track);
      });
    }
  }
}

const DRUM_TRACK_TO_SAMPLE: Record<DrumTrackKey, DrumSample> = {
  KK: 'kick',
  SN: 'snare',
  HH: 'hihat-closed',
  CR: 'crash',
  RD: 'ride',
  TM: 'tom',
};

function triggerDrum(engine: AudioEngine, track: DrumTrackKey): void {
  engine.playDrum(DRUM_TRACK_TO_SAMPLE[track]);
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
