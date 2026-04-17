import { ParseError } from './errors.js';

export type BlockType = 'score' | 'drum' | 'progression' | 'fretboard' | 'song';

const BLOCK_TYPES: ReadonlySet<string> = new Set([
  'score',
  'drum',
  'progression',
  'fretboard',
  'song',
]);

export interface BlockHeader {
  type: BlockType;
  timeSignature?: { beats: number; beatValue: number };
  params: Record<string, string>;
  positional: string[];
}

export interface BlockTokenized {
  header: BlockHeader;
  contentLines: string[];
}

const TIME_SIG_RE = /^(\d+)\/(\d+)$/;
const PARAM_RE = /^([a-zA-Z_][a-zA-Z0-9_]*):(.+)$/;

export function tokenizeBlock(dsl: string): BlockTokenized {
  const rawLines = dsl.split('\n');
  const firstLineIndex = rawLines.findIndex((l) => l.trim().length > 0);
  if (firstLineIndex === -1) throw new ParseError('Empty DSL block');

  const firstLine = rawLines[firstLineIndex] as string;
  const tokens = firstLine.trim().split(/\s+/);
  if (tokens.length === 0) throw new ParseError('Empty block header');

  const typeToken = tokens[0];
  if (!typeToken || !BLOCK_TYPES.has(typeToken)) {
    throw new ParseError(`Unknown block type: ${typeToken ?? '<empty>'}`);
  }
  const type = typeToken as BlockType;

  const header: BlockHeader = {
    type,
    params: {},
    positional: [],
  };

  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i] as string;
    const sigMatch = TIME_SIG_RE.exec(token);
    if (sigMatch) {
      header.timeSignature = {
        beats: Number.parseInt(sigMatch[1] ?? '0', 10),
        beatValue: Number.parseInt(sigMatch[2] ?? '0', 10),
      };
      continue;
    }
    const paramMatch = PARAM_RE.exec(token);
    if (paramMatch) {
      const key = paramMatch[1];
      const value = paramMatch[2];
      if (key !== undefined && value !== undefined) {
        header.params[key] = value;
      }
      continue;
    }
    header.positional.push(token);
  }

  const contentLines = rawLines.slice(firstLineIndex + 1);
  return { header, contentLines };
}
