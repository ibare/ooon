export const INLINE_OON_PREFIX = 'oon:';

export interface InlineMatch {
  start: number;
  end: number;
  source: string;
}

const INLINE_RE = /`(oon:[^`]+)`/g;

export function findInlineOonMatches(text: string): InlineMatch[] {
  const results: InlineMatch[] = [];
  INLINE_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = INLINE_RE.exec(text)) !== null) {
    const raw = m[1];
    if (!raw) continue;
    results.push({ start: m.index, end: m.index + m[0].length, source: raw });
  }
  return results;
}

export function isOonCodeLanguage(language: string | null | undefined): boolean {
  return language === 'oon';
}

const BLOCK_TYPE_RE = /^\s*(score|drum|progression|fretboard|song)\b/;

export function looksLikeOonBlock(source: string): boolean {
  return BLOCK_TYPE_RE.test(source);
}
