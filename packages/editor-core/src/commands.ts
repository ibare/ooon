import { durationToBeats } from '@oon/core';
import type { DurationSymbol, NoteEvent, ScoreBar, ScoreNode, TimeSignature } from '@oon/core';

export interface InsertNoteCommand {
  type: 'insertNote';
  barIndex: number;
  pitch: string;
  duration: DurationSymbol;
}

export interface SetTimeSignatureCommand {
  type: 'setTimeSignature';
  timeSignature: TimeSignature;
}

export type ScoreCommand = InsertNoteCommand | SetTimeSignatureCommand;

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
    case 'setTimeSignature':
      return applySetTimeSignature(node, cmd);
  }
}

function applyInsertNote(node: ScoreNode, cmd: InsertNoteCommand): ScoreNode {
  const bar = node.bars[cmd.barIndex];
  if (!bar) throw new CommandError(`insertNote: bar ${cmd.barIndex} not found`);

  const beats = durationToBeats(cmd.duration);
  const used = bar.notes.reduce((sum, n) => sum + n.beats, 0);
  const remaining = node.timeSignature.beats - used;
  if (beats > remaining + 1e-9) {
    throw new CommandError(
      `insertNote: duration ${cmd.duration} (${beats} beats) exceeds remaining ${remaining}`,
    );
  }

  const note: NoteEvent = {
    pitch: cmd.pitch,
    duration: cmd.duration,
    beats,
    isRest: false,
  };
  const newBar: ScoreBar = { barNumber: bar.barNumber, notes: [...bar.notes, note] };
  const newBars = node.bars.map((b, i) => (i === cmd.barIndex ? newBar : b));
  return { ...node, bars: newBars, warnings: [] };
}

function applySetTimeSignature(node: ScoreNode, cmd: SetTimeSignatureCommand): ScoreNode {
  // 박자 전환 시 기존 음표는 초기화 — 스펙 명세("전환 시 기존 음표는 초기화")
  const emptyBar: ScoreBar = { barNumber: 1, notes: [] };
  return { ...node, timeSignature: cmd.timeSignature, bars: [emptyBar], warnings: [] };
}
