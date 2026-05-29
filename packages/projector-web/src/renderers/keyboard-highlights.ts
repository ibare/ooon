import type { Projector } from '@ooon/shared';
import type { KeyLayout, KeyboardLayout } from '@ooon/instrument-layouts';
import { CanvasProjector } from '../canvas-projector.js';
import { FONT, METRICS } from '../theme.js';

export interface KeyboardHighlightInput {
  /** 활성 melody 노트 MIDI(rest거나 미상이면 null). */
  melodyMidi: number | null;
  /** 활성 chord 보이싱 MIDI 집합. */
  chordMidis: ReadonlySet<number> | readonly number[];
  /** 활성 chord의 루트 MIDI. 미상이면 null. 루트는 보이싱과 다른 색으로 표시된다. */
  rootMidi: number | null;
}

export interface KeyboardHighlightOptions {
  originX?: number;
  originY?: number;
  /** 폴백(비-Canvas) 백엔드에서 chord 매칭 키 색. */
  chordColor?: string;
  /** 폴백(비-Canvas) 백엔드에서 melody 매칭 키 색. */
  melodyColor?: string;
}

const DEFAULT_CHORD_COLOR = 'rgba(37, 99, 235, 0.28)';
const DEFAULT_MELODY_COLOR = 'rgba(220, 38, 38, 0.55)';

const VOICING_WHITE_GRAD: ReadonlyArray<readonly [number, string]> = [
  [0, 'rgba(59,111,160,0.15)'],
  [0.5, 'rgba(59,111,160,0.28)'],
  [1, 'rgba(59,111,160,0.38)'],
];
const ROOT_WHITE_GRAD: ReadonlyArray<readonly [number, string]> = [
  [0, 'rgba(181,69,58,0.18)'],
  [0.5, 'rgba(181,69,58,0.32)'],
  [1, 'rgba(181,69,58,0.42)'],
];
const VOICING_BLACK_GRAD: ReadonlyArray<readonly [number, string]> = [
  [0, '#1E4A6E'],
  [0.4, '#2A5E88'],
  [0.85, '#1E4A6E'],
  [1, '#4A88B8'],
];
const ROOT_BLACK_GRAD: ReadonlyArray<readonly [number, string]> = [
  [0, '#8B2A1E'],
  [0.4, '#A03828'],
  [0.85, '#8B2A1E'],
  [1, '#C46050'],
];

const VOICING_LABEL_COLOR = 'rgba(59,111,160,0.85)';
const ROOT_LABEL_COLOR = 'rgba(181,69,58,0.85)';
const BLACK_PRESSED_LABEL_COLOR = 'rgba(255,255,255,0.85)';

const WHITE_PRESS_DY = 1.5;
const BLACK_PRESS_DY = 1;

/**
 * Song 키보드 위에 활성 키를 풍부한 "눌림" 상태로 덮어그린다.
 * - 루트 MIDI는 빨강 계열, 그 외 chord 보이싱과 melody는 파랑 계열로 표시.
 * - CanvasProjector이면 그라디언트/라벨 풀 렌더링, 그 외 백엔드는 단색 사각형 폴백.
 * 키 자체의 default 그라디언트/그림자는 keyboard-renderer가 이미 그려둔 상태를 가정한다.
 */
export function drawKeyboardHighlights(
  projector: Projector,
  layout: KeyboardLayout,
  active: KeyboardHighlightInput,
  opts: KeyboardHighlightOptions = {},
): void {
  const ox = opts.originX ?? 0;
  const oy = opts.originY ?? 0;

  const chordSet = toSet(active.chordMidis);
  const melodyMidi = active.melodyMidi;
  const rootMidi = active.rootMidi;

  if (chordSet.size === 0 && melodyMidi === null) return;

  // 루트 MIDI는 보이싱과 별도로 분류한다(루트가 voicing 안에 있어도 색은 루트 우선).
  const isRoot = (midi: number): boolean => rootMidi !== null && midi === rootMidi;
  const isPressed = (midi: number): boolean =>
    chordSet.has(midi) || (melodyMidi !== null && midi === melodyMidi);

  projector.save();
  projector.translate(ox, oy);

  if (projector instanceof CanvasProjector) {
    projector.withCanvas2D((ctx) => {
      // 흰 건반 먼저, 검은 건반 나중에 (스택 순서)
      for (const key of layout.keys) {
        if (key.isBlack) continue;
        if (!isPressed(key.midi)) continue;
        drawWhiteKeyPressed(ctx, key, isRoot(key.midi));
      }
      for (const key of layout.keys) {
        if (!key.isBlack) continue;
        if (!isPressed(key.midi)) continue;
        drawBlackKeyPressed(ctx, key, isRoot(key.midi));
      }
    });
  } else {
    drawFlatHighlights(projector, layout, {
      chordSet,
      melodyMidi,
      chordColor: opts.chordColor ?? DEFAULT_CHORD_COLOR,
      melodyColor: opts.melodyColor ?? DEFAULT_MELODY_COLOR,
    });
  }

  projector.restore();
}

function toSet(input: ReadonlySet<number> | readonly number[]): ReadonlySet<number> {
  return input instanceof Set ? (input as ReadonlySet<number>) : new Set<number>(input as readonly number[]);
}

function drawFlatHighlights(
  projector: Projector,
  layout: KeyboardLayout,
  args: {
    chordSet: ReadonlySet<number>;
    melodyMidi: number | null;
    chordColor: string;
    melodyColor: string;
  },
): void {
  if (args.chordSet.size > 0) {
    for (const key of layout.keys) {
      if (key.isBlack) continue;
      if (args.chordSet.has(key.midi)) projector.drawRect(key.rect, args.chordColor);
    }
    for (const key of layout.keys) {
      if (!key.isBlack) continue;
      if (args.chordSet.has(key.midi)) projector.drawRect(key.rect, args.chordColor);
    }
  }
  if (args.melodyMidi !== null) {
    const target = layout.keys.find((k) => k.midi === args.melodyMidi);
    if (target) projector.drawRect(target.rect, args.melodyColor);
  }
}

function drawWhiteKeyPressed(
  ctx: CanvasRenderingContext2D,
  key: KeyLayout,
  isRoot: boolean,
): void {
  // 1.5px translate + 1.5px 높이 축소로 원래 rect 안에 머물게 한다.
  const x = key.rect.x;
  const y = key.rect.y + WHITE_PRESS_DY;
  const w = key.rect.width;
  const h = key.rect.height - WHITE_PRESS_DY;

  // 색 fill (default 그라디언트 위에 덮어 칠한다)
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  const stops = isRoot ? ROOT_WHITE_GRAD : VOICING_WHITE_GRAD;
  for (const [t, color] of stops) grad.addColorStop(t, color);
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  // 라벨 — 음이름
  if (key.label) {
    ctx.save();
    ctx.fillStyle = isRoot ? ROOT_LABEL_COLOR : VOICING_LABEL_COLOR;
    ctx.font = `bold 10px ${FONT.ui}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(key.label, x + w / 2, y + h - 6);
    ctx.restore();
  }
}

function drawBlackKeyPressed(
  ctx: CanvasRenderingContext2D,
  key: KeyLayout,
  isRoot: boolean,
): void {
  const x = key.rect.x;
  const y = key.rect.y + BLACK_PRESS_DY;
  const w = key.rect.width;
  const h = key.rect.height - BLACK_PRESS_DY;
  const r = Math.min(METRICS.blackKeyRadius, w / 2, h / 2);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.closePath();
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  const stops = isRoot ? ROOT_BLACK_GRAD : VOICING_BLACK_GRAD;
  for (const [t, color] of stops) grad.addColorStop(t, color);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();

  // 라벨 — 검은 건반에선 항상 흰색 bold 8px
  if (key.label) {
    ctx.save();
    ctx.fillStyle = BLACK_PRESSED_LABEL_COLOR;
    ctx.font = `bold 8px ${FONT.ui}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(key.label, x + w / 2, y + h - 6);
    ctx.restore();
  }
}
