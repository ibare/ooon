export { EditableScore } from './editable-score.js';
export type {
  EditableScoreOptions,
  ScoreChangeEvent,
  ScoreChangeListener,
} from './editable-score.js';

export { applyScoreCommand, CommandError } from './commands.js';
export type {
  ScoreCommand,
  InsertNoteCommand,
  InsertRestCommand,
  ReplaceNoteCommand,
  ReplaceWithRestCommand,
  SetTimeSignatureCommand,
  AppendBarCommand,
} from './commands.js';
