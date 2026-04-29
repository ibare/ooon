export const THEME = {
  background: '#ffffff',
  foreground: '#111827',
  muted: '#6b7280',
  subtle: '#e5e7eb',
  accent: '#2563eb',
  accentSoft: '#bfdbfe',
  danger: '#dc2626',
  warn: '#d97706',
  grid: '#d1d5db',
  staffLine: '#111827',
  barline: '#111827',
  whiteKey: '#ffffff',
  whiteKeyStroke: '#111827',
  blackKey: '#111827',
  keyLabel: '#374151',
  highlight: '#2563eb',
  highlightSoft: '#93c5fd',
  rootDot: '#dc2626',
  scaleDot: '#2563eb',
  drumCell: '#bfdbfe',
  drumCellInactive: '#f3f4f6',
  drumCellTop: '#10b981',
  drumCellMid: '#06b6d4',
  drumCellBottom: '#f59e0b',
  drumBarline: '#9ca3af',
  cardBackground: '#f9fafb',
  cardBorder: '#d1d5db',
} as const;

export const FONT = {
  ui: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  bravura: 'Bravura, serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
} as const;

export const METRICS = {
  stroke: 1,
  staffLineWidth: 1,
  barlineWidth: 1.5,
  stemWidth: 1.5,
  ledgerWidth: 1,
  cardRadius: 6,
  drumCellRadius: 0,
  drumCellActiveInset: 2,
  drumCellActiveRadius: 2,
  drumBarlineWidth: 1,
} as const;

export type ThemeKey = keyof typeof THEME;
export type FontKey = keyof typeof FONT;
