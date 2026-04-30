import type { BeatSlotRect } from '../geometry/beat-overlay.js';
import type { PluckZoneRect } from '../geometry/pluck-zone.js';
import type { PickerLayout } from '../render/draw-picker.js';

export type EditorMode = 'idle' | 'picker' | 'plucking';

export interface VibrationState {
  startTime: number; // performance.now() ms
  centerY: number;
  x1: number;
  x2: number;
}

export interface MetronomeBlinkState {
  /** 슬롯 인덱스(beatIndex) → 활성 여부 */
  activeBeat: number;
  /** 트리거 시작 시각 */
  startTime: number;
  /** 마디 인덱스(node 기준) */
  barIndex: number;
}

export interface EditorState {
  mode: EditorMode;
  hoveredSlot: BeatSlotRect | null;
  hoveredZone: PluckZoneRect | null;
  pluckSnappedY: number | null;
  pluckPitch: string | null;
  picker: {
    layout: PickerLayout;
    barIndex: number;
    beatIndex: number;
    pitch: string; // 자동: 보표 중앙 라인의 step 기준(B4)
    hoveredIndex: number | null;
  } | null;
  vibration: VibrationState | null;
  blink: MetronomeBlinkState | null;
}

export function initialState(): EditorState {
  return {
    mode: 'idle',
    hoveredSlot: null,
    hoveredZone: null,
    pluckSnappedY: null,
    pluckPitch: null,
    picker: null,
    vibration: null,
    blink: null,
  };
}
