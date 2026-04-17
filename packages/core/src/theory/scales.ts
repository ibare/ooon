import { noteName, pitchClassOf } from './notes.js';

export type ScaleType =
  | 'major'
  | 'minor'
  | 'harmonic-minor'
  | 'dorian'
  | 'phrygian'
  | 'lydian'
  | 'mixolydian'
  | 'minor-pentatonic'
  | 'major-pentatonic'
  | 'blues';

export const SCALE_INTERVALS: Record<ScaleType, readonly number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  'harmonic-minor': [0, 2, 3, 5, 7, 8, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  'minor-pentatonic': [0, 3, 5, 7, 10],
  'major-pentatonic': [0, 2, 4, 7, 9],
  blues: [0, 3, 5, 6, 7, 10],
};

const ALIAS: Record<string, ScaleType> = {
  major: 'major',
  minor: 'minor',
  'natural minor': 'minor',
  'harmonic minor': 'harmonic-minor',
  'harmonic-minor': 'harmonic-minor',
  'minor pentatonic': 'minor-pentatonic',
  'minor-pentatonic': 'minor-pentatonic',
  'major pentatonic': 'major-pentatonic',
  'major-pentatonic': 'major-pentatonic',
  dorian: 'dorian',
  phrygian: 'phrygian',
  lydian: 'lydian',
  mixolydian: 'mixolydian',
  blues: 'blues',
};

export class ScaleParseError extends Error {
  constructor(input: string) {
    super(`Invalid scale: ${input}`);
    this.name = 'ScaleParseError';
  }
}

export interface ParsedScale {
  root: string;
  scaleType: ScaleType;
  intervals: readonly number[];
  notes: readonly string[];
}

export function parseScaleType(input: string): ScaleType {
  const key = input.trim().toLowerCase();
  const hit = ALIAS[key];
  if (!hit) throw new ScaleParseError(input);
  return hit;
}

export function buildScale(root: string, scaleType: ScaleType): ParsedScale {
  const intervals = SCALE_INTERVALS[scaleType];
  const rootPc = pitchClassOf(root);
  const useFlats = root.includes('b');
  const notes = intervals.map((semi) => noteName((rootPc + semi) % 12, useFlats));
  return { root, scaleType, intervals, notes };
}

const SCALE_LINE_RE = /^([A-G][#b]?)\s+(.+)$/;

export function parseScaleLine(line: string): ParsedScale {
  const m = SCALE_LINE_RE.exec(line.trim());
  if (!m) throw new ScaleParseError(line);
  const root = m[1] ?? '';
  const typeStr = m[2] ?? '';
  const scaleType = parseScaleType(typeStr);
  return buildScale(root, scaleType);
}
