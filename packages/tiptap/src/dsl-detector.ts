export const INLINE_OOON_PREFIX = 'ooon:';

export interface InlineMatch {
  start: number;
  end: number;
  source: string;
}

const INLINE_RE = /`(ooon:[^`]+)`/g;

export function findInlineOoonMatches(text: string): InlineMatch[] {
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

export function isOoonCodeLanguage(language: string | null | undefined): boolean {
  return language === 'ooon';
}

const BLOCK_TYPE_RE = /^\s*(score|drum|progression|fretboard|song)\b/;

export function looksLikeOoonBlock(source: string): boolean {
  return BLOCK_TYPE_RE.test(source);
}
