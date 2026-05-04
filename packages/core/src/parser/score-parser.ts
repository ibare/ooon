import type { NoteEvent, ScoreBar, ScoreNode, TimeSignature } from '../ast/types.js';
import { parsePitch } from '../theory/notes.js';
import { durationToBeats, isDurationSymbol } from './duration.js';
import { ParseError } from './errors.js';
import type { BlockTokenized } from './tokenizer.js';

// 단음 토큰: pitch + 옵션 옥타브 + 길이 (예: A3/q, C/q, r/q)
const SINGLE_NOTE_RE = /^([A-Ga-gr])([#b]?)(-?\d+)?\/([whqes]\.?)$/;
// 화음 토큰의 길이 부분: ]/q 형태. 길이 ≥2 pitch를 [] 안에 공백으로 나열한다.
const CHORD_DUR_RE = /^\/([whqes]\.?)$/;
// 화음 안 단일 pitch 토큰(쉼표 금지 — 화음은 모두 발음).
const CHORD_PITCH_RE = /^([A-Ga-g])([#b]?)(-?\d+)?$/;

function parseChordPitchToken(token: string): string {
  // 'r'은 화음 안에서 명시적으로 거부 — regex 미스매치 메시지보다 의도가 분명한 에러를 준다.
  if (/^r\d*$/i.test(token)) {
    throw new ParseError(`Rest 'r' not allowed inside chord: ${token}`);
  }
  const m = CHORD_PITCH_RE.exec(token);
  if (!m) throw new ParseError(`Invalid chord pitch: ${token}`);
  const letter = m[1];
  const acc = m[2] ?? '';
  const oct = m[3];
  if (!letter) throw new ParseError(`Invalid chord pitch: ${token}`);
  const octStr = oct !== undefined ? oct : '4';
  const pitch = letter.toUpperCase() + acc + octStr;
  parsePitch(pitch);
  return pitch;
}

function parseSingleNoteToken(token: string, beatValue: number): NoteEvent {
  const m = SINGLE_NOTE_RE.exec(token);
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
    return { pitches: [], duration: dur, beats, isRest: true };
  }
  const octStr = oct !== undefined ? oct : '4';
  const pitch = letter.toUpperCase() + acc + octStr;
  parsePitch(pitch);
  return { pitches: [pitch], duration: dur, beats, isRest: false };
}

// 화음 토큰: "[C4 E4 G4]/q" 형태. 토크나이저가 bracket을 단일 토큰으로 묶어 넘겨준다.
function parseChordToken(token: string, beatValue: number): NoteEvent {
  const close = token.indexOf(']');
  if (!token.startsWith('[') || close === -1) {
    throw new ParseError(`Invalid chord token: ${token}`);
  }
  const inside = token.slice(1, close).trim();
  const tail = token.slice(close + 1);
  const dm = CHORD_DUR_RE.exec(tail);
  if (!dm) throw new ParseError(`Invalid chord duration: ${token}`);
  const dur = dm[1];
  if (!dur || !isDurationSymbol(dur)) throw new ParseError(`Invalid chord duration: ${token}`);
  const pitchTokens = inside.split(/\s+/).filter((s) => s.length > 0);
  if (pitchTokens.length < 2) {
    throw new ParseError(`Chord must contain at least 2 pitches: ${token}`);
  }
  const pitches = pitchTokens.map(parseChordPitchToken);
  const beats = durationToBeats(dur, beatValue);
  return { pitches, duration: dur, beats, isRest: false };
}

function parseNoteToken(token: string, beatValue: number): NoteEvent {
  if (token.startsWith('[')) return parseChordToken(token, beatValue);
  return parseSingleNoteToken(token, beatValue);
}

// bracket을 인지하는 토크나이저. "[" 진입 후 "]" 까지 공백을 무시하고 한 토큰으로 묶는다.
// "]" 이후에 곧바로 "/길이"가 따라붙어야 화음 토큰이 완성된다.
function tokenizeBar(barStr: string): string[] {
  const tokens: string[] = [];
  const len = barStr.length;
  let i = 0;
  while (i < len) {
    const ch = barStr[i] ?? '';
    if (ch === ' ' || ch === '\t') {
      i++;
      continue;
    }
    if (ch === '[') {
      const close = barStr.indexOf(']', i);
      if (close === -1) throw new ParseError(`Unclosed chord bracket: ${barStr.slice(i)}`);
      // ']' 다음의 비공백 끝까지(=다음 공백 또는 문자열 끝)를 한 토큰으로 묶는다.
      let j = close + 1;
      while (j < len) {
        const c = barStr[j];
        if (c === ' ' || c === '\t' || c === '[') break;
        j++;
      }
      tokens.push(barStr.slice(i, j));
      i = j;
      continue;
    }
    let j = i;
    while (j < len) {
      const c = barStr[j];
      if (c === ' ' || c === '\t' || c === '[') break;
      j++;
    }
    tokens.push(barStr.slice(i, j));
    i = j;
  }
  return tokens;
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
    const tokens = tokenizeBar(barStr);
    const notes = tokens.map((tok) => parseNoteToken(tok, timeSignature.beatValue));
    const total = notes.reduce((sum, n) => sum + n.beats, 0);
    const expected = timeSignature.beats;
    if (total < expected) {
      const remaining = expected - total;
      notes.push({ pitches: [], duration: 'q', beats: remaining, isRest: true });
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
