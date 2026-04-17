import type { BlockNode } from '../ast/types.js';
import { parseDrumBlock } from './drum-parser.js';
import { parseFretboardBlock } from './fretboard-parser.js';
import { parseProgressionBlock } from './progression-parser.js';
import { parseScoreBlock } from './score-parser.js';
import { parseSongBlock } from './song-parser.js';
import { tokenizeBlock } from './tokenizer.js';

export function parseBlock(dsl: string): BlockNode {
  const t = tokenizeBlock(dsl);
  switch (t.header.type) {
    case 'score':
      return parseScoreBlock(t);
    case 'drum':
      return parseDrumBlock(t);
    case 'progression':
      return parseProgressionBlock(t);
    case 'fretboard':
      return parseFretboardBlock(t);
    case 'song':
      return parseSongBlock(t);
  }
}
