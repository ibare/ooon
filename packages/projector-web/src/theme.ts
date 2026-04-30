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
  /** 재생 중 마디 배경 / 플레이헤드 점선 색(앰버 톤). */
  playheadAmber: '#9a6b28',
} as const;

/**
 * 코드 기능별 색 팔레트. 카드 렌더러에서 사용.
 * - bar: 좌측 컬러 바 / 활성 테두리 / 그림자
 * - bg: 비활성 카드 배경
 * - act: 활성(재생 중) 카드 배경
 * - txt: 로마 숫자/심볼의 액센트 색
 */
export const FUNCTION_PALETTE = {
  tonic: {
    bar: '#3B6FA0',
    bg: 'rgba(59,111,160,0.04)',
    act: 'rgba(59,111,160,0.13)',
    txt: '#3B6FA0',
  },
  subdominant: {
    bar: '#4A8C5E',
    bg: 'rgba(74,140,94,0.04)',
    act: 'rgba(74,140,94,0.13)',
    txt: '#4A8C5E',
  },
  dominant: {
    bar: '#C4783C',
    bg: 'rgba(196,120,60,0.04)',
    act: 'rgba(196,120,60,0.13)',
    txt: '#C4783C',
  },
  /** 기능 미상 — 중성 톤. */
  neutral: {
    bar: '#9CA3AF',
    bg: 'rgba(156,163,175,0.04)',
    act: 'rgba(156,163,175,0.13)',
    txt: '#6B7280',
  },
} as const;

export type FunctionKey = keyof typeof FUNCTION_PALETTE;

/** 드럼 트랙별 on/off 색. drum-renderer가 사용. */
export const DRUM_TRACK_COLOR: Record<string, { on: string; off: string }> = {
  HH: { on: '#2A9D8F', off: 'rgba(42,157,143,0.10)' },
  CR: { on: '#2A9D8F', off: 'rgba(42,157,143,0.10)' },
  RD: { on: '#2A9D8F', off: 'rgba(42,157,143,0.10)' },
  SN: { on: '#3B6FA0', off: 'rgba(59,111,160,0.10)' },
  TM: { on: '#3B6FA0', off: 'rgba(59,111,160,0.10)' },
  KK: { on: '#D4783C', off: 'rgba(212,120,60,0.10)' },
};

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
  cardRadius: 7,
  drumCellRadius: 0,
  drumCellActiveInset: 2,
  drumCellActiveRadius: 2,
  drumBarlineWidth: 1,
  blackKeyRadius: 3.5,
  /** 카드 좌측 컬러 바 폭. */
  cardColorBarWidth: 3.5,
  /** 카드 떠오름 변위(활성 시). */
  cardPressDy: 2,
  /** 드럼 셀 라운드 반경(rich 모드). */
  drumCellRichRadius: 2,
  /** 드럼 셀 사이 갭(rich 모드, 좌우 합). */
  drumCellGap: 1.2,
} as const;

export type ThemeKey = keyof typeof THEME;
export type FontKey = keyof typeof FONT;
