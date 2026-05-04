import { durationToBeats, stepPitch } from '@oon/core';
import type { DurationSymbol, NoteEvent, ScoreBar, ScoreNode, TimeSignature } from '@oon/core';

export interface InsertNoteCommand {
  type: 'insertNote';
  barIndex: number;
  pitch: string;
  duration: DurationSymbol;
}

export interface InsertRestCommand {
  type: 'insertRest';
  barIndex: number;
  duration: DurationSymbol;
}

export interface ReplaceNoteCommand {
  type: 'replaceNote';
  barIndex: number;
  noteIndex: number;
  duration: DurationSymbol;
}

export interface ReplaceWithRestCommand {
  type: 'replaceWithRest';
  barIndex: number;
  noteIndex: number;
  duration: DurationSymbol;
}

export interface SetTimeSignatureCommand {
  type: 'setTimeSignature';
  timeSignature: TimeSignature;
}

export interface AppendBarCommand {
  type: 'appendBar';
}

// 음표/화음의 모든 head를 한 단계 ↑/↓ 이동(반음, ↑은 ♯ 우선/↓은 ♭ 우선).
// 화음은 head별 독립 적용 → 결과적으로 모든 head가 같은 semitone만큼 이동.
// 쉼표 대상은 거부.
export interface TransposeNoteCommand {
  type: 'transposeNote';
  barIndex: number;
  noteIndex: number;
  direction: 'up' | 'down';
}

// 음표에 새 pitch를 추가해 화음을 만들거나 화음에 head를 더한다.
// 단음→화음 강등 같은 별도 모드 분기는 없음(pitches.length로 자동 결정).
// 중복 pitch는 거부, 쉼표 대상도 거부.
export interface AddChordPitchCommand {
  type: 'addChordPitch';
  barIndex: number;
  noteIndex: number;
  pitch: string;
}

// 화음에서 특정 pitch index의 head를 제거. 마지막 head는 보존(거부) — 강등은 자동(pitches.length===1).
// 음표 자체를 삭제하거나 쉼표로 바꾸려면 별도 명령(replaceWithRest 등) 사용.
export interface RemoveChordHeadCommand {
  type: 'removeChordHead';
  barIndex: number;
  noteIndex: number;
  pitchIndex: number;
}

export type ScoreCommand =
  | InsertNoteCommand
  | InsertRestCommand
  | ReplaceNoteCommand
  | ReplaceWithRestCommand
  | SetTimeSignatureCommand
  | AppendBarCommand
  | TransposeNoteCommand
  | AddChordPitchCommand
  | RemoveChordHeadCommand;

export class CommandError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CommandError';
  }
}

// 새 ScoreNode를 반환한다. 입력 node는 변경하지 않는다(immutable update).
// editable-score는 이 결과를 받아 내부 참조를 교체하고 listener에 통지한다.
export function applyScoreCommand(node: ScoreNode, cmd: ScoreCommand): ScoreNode {
  switch (cmd.type) {
    case 'insertNote':
      return applyInsertNote(node, cmd);
    case 'insertRest':
      return applyInsertRest(node, cmd);
    case 'replaceNote':
      return applyReplaceNote(node, cmd);
    case 'replaceWithRest':
      return applyReplaceWithRest(node, cmd);
    case 'setTimeSignature':
      return applySetTimeSignature(node, cmd);
    case 'appendBar':
      return applyAppendBar(node);
    case 'transposeNote':
      return applyTransposeNote(node, cmd);
    case 'addChordPitch':
      return applyAddChordPitch(node, cmd);
    case 'removeChordHead':
      return applyRemoveChordHead(node, cmd);
  }
}

function applyInsertNote(node: ScoreNode, cmd: InsertNoteCommand): ScoreNode {
  const bar = node.bars[cmd.barIndex];
  if (!bar) throw new CommandError(`insertNote: bar ${cmd.barIndex} not found`);

  const beats = durationToBeats(cmd.duration, node.timeSignature.beatValue);
  const used = bar.notes.reduce((sum, n) => sum + n.beats, 0);
  const remaining = node.timeSignature.beats - used;
  if (beats > remaining + 1e-9) {
    throw new CommandError(
      `insertNote: duration ${cmd.duration} (${beats} beats) exceeds remaining ${remaining}`,
    );
  }

  const note: NoteEvent = {
    pitches: [cmd.pitch],
    duration: cmd.duration,
    beats,
    isRest: false,
  };
  const newBar: ScoreBar = { barNumber: bar.barNumber, notes: [...bar.notes, note] };
  const newBars = node.bars.map((b, i) => (i === cmd.barIndex ? newBar : b));
  return { ...node, bars: newBars, warnings: [] };
}

function applyInsertRest(node: ScoreNode, cmd: InsertRestCommand): ScoreNode {
  const bar = node.bars[cmd.barIndex];
  if (!bar) throw new CommandError(`insertRest: bar ${cmd.barIndex} not found`);

  const beats = durationToBeats(cmd.duration, node.timeSignature.beatValue);
  const used = bar.notes.reduce((sum, n) => sum + n.beats, 0);
  const remaining = node.timeSignature.beats - used;
  if (beats > remaining + 1e-9) {
    throw new CommandError(
      `insertRest: duration ${cmd.duration} (${beats} beats) exceeds remaining ${remaining}`,
    );
  }

  const rest: NoteEvent = {
    pitches: [],
    duration: cmd.duration,
    beats,
    isRest: true,
  };
  const newBar: ScoreBar = { barNumber: bar.barNumber, notes: [...bar.notes, rest] };
  const newBars = node.bars.map((b, i) => (i === cmd.barIndex ? newBar : b));
  return { ...node, bars: newBars, warnings: [] };
}

// 마디 내 특정 인덱스 음표를 새 duration으로 교체. pitches는 유지(음정 변경은 별도 UI).
// source가 쉼표인 경우 pitch가 없으므로 거부 — replaceWithRest를 쓰거나 별도 명령 필요.
function applyReplaceNote(node: ScoreNode, cmd: ReplaceNoteCommand): ScoreNode {
  const bar = node.bars[cmd.barIndex];
  if (!bar) throw new CommandError(`replaceNote: bar ${cmd.barIndex} not found`);
  const current = bar.notes[cmd.noteIndex];
  if (!current) {
    throw new CommandError(
      `replaceNote: noteIndex ${cmd.noteIndex} not found in bar ${cmd.barIndex}`,
    );
  }
  if (current.isRest) {
    throw new CommandError(
      `replaceNote: source at bar ${cmd.barIndex} note ${cmd.noteIndex} is a rest — pitch unavailable`,
    );
  }

  const newBeats = durationToBeats(cmd.duration, node.timeSignature.beatValue);
  const otherBeats = bar.notes.reduce((sum, n, i) => (i === cmd.noteIndex ? sum : sum + n.beats), 0);
  const remaining = node.timeSignature.beats - otherBeats;
  if (newBeats > remaining + 1e-9) {
    throw new CommandError(
      `replaceNote: duration ${cmd.duration} (${newBeats} beats) exceeds remaining ${remaining}`,
    );
  }

  const newNote: NoteEvent = {
    pitches: current.pitches,
    duration: cmd.duration,
    beats: newBeats,
    isRest: false,
  };
  const newNotes = bar.notes.map((n, i) => (i === cmd.noteIndex ? newNote : n));
  const newBar: ScoreBar = { barNumber: bar.barNumber, notes: newNotes };
  const newBars = node.bars.map((b, i) => (i === cmd.barIndex ? newBar : b));
  return { ...node, bars: newBars, warnings: [] };
}

// 마디 내 특정 인덱스의 음표/쉼표를 쉼표로 교체. source의 종류는 가리지 않는다.
function applyReplaceWithRest(node: ScoreNode, cmd: ReplaceWithRestCommand): ScoreNode {
  const bar = node.bars[cmd.barIndex];
  if (!bar) throw new CommandError(`replaceWithRest: bar ${cmd.barIndex} not found`);
  const current = bar.notes[cmd.noteIndex];
  if (!current) {
    throw new CommandError(
      `replaceWithRest: noteIndex ${cmd.noteIndex} not found in bar ${cmd.barIndex}`,
    );
  }

  const newBeats = durationToBeats(cmd.duration, node.timeSignature.beatValue);
  const otherBeats = bar.notes.reduce((sum, n, i) => (i === cmd.noteIndex ? sum : sum + n.beats), 0);
  const remaining = node.timeSignature.beats - otherBeats;
  if (newBeats > remaining + 1e-9) {
    throw new CommandError(
      `replaceWithRest: duration ${cmd.duration} (${newBeats} beats) exceeds remaining ${remaining}`,
    );
  }

  const newRest: NoteEvent = {
    pitches: [],
    duration: cmd.duration,
    beats: newBeats,
    isRest: true,
  };
  const newNotes = bar.notes.map((n, i) => (i === cmd.noteIndex ? newRest : n));
  const newBar: ScoreBar = { barNumber: bar.barNumber, notes: newNotes };
  const newBars = node.bars.map((b, i) => (i === cmd.barIndex ? newBar : b));
  return { ...node, bars: newBars, warnings: [] };
}

function applySetTimeSignature(node: ScoreNode, cmd: SetTimeSignatureCommand): ScoreNode {
  // 박자 전환 시 기존 음표는 초기화 — 스펙 명세("전환 시 기존 음표는 초기화")
  const emptyBar: ScoreBar = { barNumber: 1, notes: [] };
  return { ...node, timeSignature: cmd.timeSignature, bars: [emptyBar], warnings: [] };
}

// score 끝에 빈 마디를 한 개 추가한다. barNumber는 직전 마디 + 1, 빈 bars[]면 1.
function applyAppendBar(node: ScoreNode): ScoreNode {
  const last = node.bars[node.bars.length - 1];
  const nextNumber = last ? last.barNumber + 1 : 1;
  const newBar: ScoreBar = { barNumber: nextNumber, notes: [] };
  return { ...node, bars: [...node.bars, newBar], warnings: [] };
}

function getNoteOrThrow(
  node: ScoreNode,
  barIndex: number,
  noteIndex: number,
  cmdLabel: string,
): { bar: ScoreBar; note: NoteEvent } {
  const bar = node.bars[barIndex];
  if (!bar) throw new CommandError(`${cmdLabel}: bar ${barIndex} not found`);
  const note = bar.notes[noteIndex];
  if (!note) {
    throw new CommandError(`${cmdLabel}: noteIndex ${noteIndex} not found in bar ${barIndex}`);
  }
  return { bar, note };
}

function replaceNoteInBars(
  node: ScoreNode,
  barIndex: number,
  noteIndex: number,
  newNote: NoteEvent,
): ScoreNode {
  const bar = node.bars[barIndex]!;
  const newNotes = bar.notes.map((n, i) => (i === noteIndex ? newNote : n));
  const newBar: ScoreBar = { barNumber: bar.barNumber, notes: newNotes };
  const newBars = node.bars.map((b, i) => (i === barIndex ? newBar : b));
  return { ...node, bars: newBars, warnings: [] };
}

function applyTransposeNote(node: ScoreNode, cmd: TransposeNoteCommand): ScoreNode {
  const { note } = getNoteOrThrow(node, cmd.barIndex, cmd.noteIndex, 'transposeNote');
  if (note.isRest) {
    throw new CommandError(
      `transposeNote: source at bar ${cmd.barIndex} note ${cmd.noteIndex} is a rest`,
    );
  }
  const newPitches = note.pitches.map((p) => stepPitch(p, cmd.direction));
  const newNote: NoteEvent = { ...note, pitches: newPitches };
  return replaceNoteInBars(node, cmd.barIndex, cmd.noteIndex, newNote);
}

function applyAddChordPitch(node: ScoreNode, cmd: AddChordPitchCommand): ScoreNode {
  const { note } = getNoteOrThrow(node, cmd.barIndex, cmd.noteIndex, 'addChordPitch');
  if (note.isRest) {
    throw new CommandError(
      `addChordPitch: source at bar ${cmd.barIndex} note ${cmd.noteIndex} is a rest`,
    );
  }
  if (note.pitches.includes(cmd.pitch)) {
    throw new CommandError(
      `addChordPitch: pitch ${cmd.pitch} already present in chord at bar ${cmd.barIndex} note ${cmd.noteIndex}`,
    );
  }
  const newPitches = [...note.pitches, cmd.pitch];
  const newNote: NoteEvent = { ...note, pitches: newPitches };
  return replaceNoteInBars(node, cmd.barIndex, cmd.noteIndex, newNote);
}

function applyRemoveChordHead(node: ScoreNode, cmd: RemoveChordHeadCommand): ScoreNode {
  const { note } = getNoteOrThrow(node, cmd.barIndex, cmd.noteIndex, 'removeChordHead');
  if (note.isRest) {
    throw new CommandError(
      `removeChordHead: source at bar ${cmd.barIndex} note ${cmd.noteIndex} is a rest`,
    );
  }
  if (cmd.pitchIndex < 0 || cmd.pitchIndex >= note.pitches.length) {
    throw new CommandError(
      `removeChordHead: pitchIndex ${cmd.pitchIndex} out of range (chord size ${note.pitches.length})`,
    );
  }
  if (note.pitches.length <= 1) {
    throw new CommandError(
      `removeChordHead: cannot remove the last head (use replaceWithRest to convert to rest, or delete the note)`,
    );
  }
  const newPitches = note.pitches.filter((_, i) => i !== cmd.pitchIndex);
  const newNote: NoteEvent = { ...note, pitches: newPitches };
  return replaceNoteInBars(node, cmd.barIndex, cmd.noteIndex, newNote);
}
