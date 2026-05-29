import type { Projector } from '@ooon/shared';
import { VIBRATION_AMPLITUDE_PX, VIBRATION_DECAY_SEC, VIBRATION_FREQ_HZ } from '../constants.js';
import { PLUCK_ZONE_HIGHLIGHT_STROKE } from '../constants.js';

export interface VibrationFrame {
  /** 진동 시작 후 경과 초. 0 이상 VIBRATION_DECAY_SEC*1.5 이하. */
  elapsedSec: number;
  /** 영향 받는 line/space y(스냅된 좌표). */
  centerY: number;
  /** 시작 x. 보통 마지막 마디의 시작 x. */
  x1: number;
  /** 끝 x. 보통 pluck zone의 우측 끝. */
  x2: number;
}

// 감쇠 사인파: y(t) = A * exp(-t/τ) * sin(2π f t)
// line을 미세하게 흔들어 "튕긴 줄"의 잔향을 시각화한다.
export function drawVibrationLine(
  projector: Projector,
  frame: VibrationFrame,
): void {
  const t = Math.max(0, frame.elapsedSec);
  const amp = VIBRATION_AMPLITUDE_PX * Math.exp(-t / VIBRATION_DECAY_SEC);
  const phase = 2 * Math.PI * VIBRATION_FREQ_HZ * t;
  const segs = 24;
  let prevX = frame.x1;
  let prevY = frame.centerY;
  for (let i = 1; i <= segs; i++) {
    const u = i / segs;
    const x = frame.x1 + (frame.x2 - frame.x1) * u;
    // 양 끝(노드)에서 진폭 0이 되도록 sin(πu) 봉우리 적용.
    const env = Math.sin(Math.PI * u);
    const y = frame.centerY + amp * env * Math.sin(phase + u * Math.PI * 2);
    projector.drawLine({ x: prevX, y: prevY }, { x, y }, PLUCK_ZONE_HIGHLIGHT_STROKE, 1.5);
    prevX = x;
    prevY = y;
  }
}

export function isVibrationFinished(elapsedSec: number): boolean {
  return elapsedSec > VIBRATION_DECAY_SEC * 1.8;
}
