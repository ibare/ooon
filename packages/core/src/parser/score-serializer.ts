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
  if (note.isRest) return `r/${note.duration}`;
  // 단음은 단순 형태 유지(왕복 호환). 화음(>=2)만 [] 표기로 직렬화한다.
  if (note.pitches.length === 1) return `${note.pitches[0]}/${note.duration}`;
  return `[${note.pitches.join(' ')}]/${note.duration}`;
}
