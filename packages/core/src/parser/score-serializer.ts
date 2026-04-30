import type { NoteEvent, ScoreBar, ScoreNode } from '../ast/types.js';

const DEFAULT_BPM = 100;

export function serializeScore(node: ScoreNode): string {
  const ts = `${node.timeSignature.beats}/${node.timeSignature.beatValue}`;
  const params: string[] = [];
  if (node.bpm !== DEFAULT_BPM) params.push(`bpm:${node.bpm}`);
  if (node.key !== undefined) params.push(`key:${node.key}`);
  const header = ['score', ts, ...params].join(' ');

  if (!hasAnyNotes(node.bars)) return header;

  const body = node.bars.map(serializeBar).join(' | ');
  return `${header}\n  ${body}`;
}

function hasAnyNotes(bars: readonly ScoreBar[]): boolean {
  for (const bar of bars) if (bar.notes.length > 0) return true;
  return false;
}

function serializeBar(bar: ScoreBar): string {
  return bar.notes.map(serializeNote).join(' ');
}

function serializeNote(note: NoteEvent): string {
  const head = note.isRest ? 'r' : note.pitch;
  return `${head}/${note.duration}`;
}
