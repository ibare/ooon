import type { NoteEvent, ScoreBar, ScoreNode, TimeSignature } from '../ast/types.js';
import { parsePitch } from '../theory/notes.js';
import { durationToBeats, isDurationSymbol } from './duration.js';
import { ParseError } from './errors.js';
import type { BlockTokenized } from './tokenizer.js';

const NOTE_RE = /^([A-Ga-gr])([#b]?)(-?\d+)?\/([whqes]\.?)$/;

function parseNoteToken(token: string, beatValue: number): NoteEvent {
  const m = NOTE_RE.exec(token);
  if (!m) throw new ParseError(`Invalid note token: ${token}`);
  const letter = m[1];
  const acc = m[2] ?? '';
  const oct = m[3];
  const dur = m[4];
  if (!letter || !dur || !isDurationSymbol(dur)) {
    throw new ParseError(`Invalid note token: ${token}`);
  }
  const beats = durationToBeats(dur, beatValue);
  const isRest = letter.toLowerCase() === 'r';
  if (isRest) {
    return { pitch: '', duration: dur, beats, isRest: true };
  }
  const octStr = oct !== undefined ? oct : '4';
  const pitch = letter.toUpperCase() + acc + octStr;
  parsePitch(pitch);
  return { pitch, duration: dur, beats, isRest: false };
}

export function parseScoreBlock(t: BlockTokenized): ScoreNode {
  const timeSignature: TimeSignature = t.header.timeSignature ?? { beats: 4, beatValue: 4 };
  const bpm = parseBpm(t.header.params.bpm);
  const key = t.header.params.key;
  const warnings: string[] = [];

  const content = t.contentLines.join(' ').trim();
  if (!content) {
    // 본문 없는 score는 "편집 시작점"으로서 빈 한 마디 AST를 반환한다.
    // padding rest를 넣지 않는 이유: notes 0개여야 첫 입력이 "추가"로 자연스럽게 정의된다.
    const node: ScoreNode = {
      type: 'score',
      timeSignature,
      bpm,
      bars: [{ barNumber: 1, notes: [] }],
      warnings,
    };
    if (key !== undefined) node.key = key;
    return node;
  }
  const barStrings = content.split('|').map((s) => s.trim()).filter((s) => s.length > 0);

  const bars: ScoreBar[] = barStrings.map((barStr, idx) => {
    const tokens = barStr.split(/\s+/).filter((s) => s.length > 0);
    const notes = tokens.map((tok) => parseNoteToken(tok, timeSignature.beatValue));
    const total = notes.reduce((sum, n) => sum + n.beats, 0);
    const expected = timeSignature.beats;
    if (total < expected) {
      const remaining = expected - total;
      notes.push({ pitch: '', duration: 'q', beats: remaining, isRest: true });
      warnings.push(
        `bar ${idx + 1}: padded with rest (had ${total} beats, expected ${expected})`,
      );
    } else if (total > expected) {
      warnings.push(`bar ${idx + 1}: overflow (${total} beats > ${expected})`);
    }
    return { barNumber: idx + 1, notes };
  });

  const node: ScoreNode = { type: 'score', timeSignature, bpm, bars, warnings };
  if (key !== undefined) node.key = key;
  return node;
}

function parseBpm(raw: string | undefined): number {
  if (raw === undefined) return 100;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n) || n <= 0) throw new ParseError(`Invalid bpm: ${raw}`);
  return n;
}
