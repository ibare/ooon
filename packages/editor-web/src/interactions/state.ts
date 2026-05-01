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

// 빈 박자 슬롯에서 열린 픽커 — 새 음표/쉼표 삽입 컨텍스트.
export interface InsertPickerState {
  kind: 'insert';
  layout: PickerLayout;
  barIndex: number;
  beatIndex: number;
  pitch: string; // 자동: 보표 중앙 라인의 step 기준(B4)
  hoveredIndex: number | null;
}

// 기존 음표/쉼표를 클릭해 열린 픽커 — 같은 자리의 duration/종류 교체 컨텍스트.
export interface ReplacePickerState {
  kind: 'replace';
  layout: PickerLayout;
  barIndex: number;
  noteIndex: number;
  hoveredIndex: number | null;
}

// 박자표 클릭으로 열린 픽커 — 박자 교체. 변경 시 마디 초기화 부작용이 있어
// 명시적 클릭 컨텍스트(박자표)에서만 트리거된다.
export interface TimeSigPickerState {
  kind: 'timeSig';
  layout: PickerLayout;
  hoveredIndex: number | null;
}

export type PickerState = InsertPickerState | ReplacePickerState | TimeSigPickerState;

export interface EditorState {
  mode: EditorMode;
  hoveredSlot: BeatSlotRect | null;
  hoveredZone: PluckZoneRect | null;
  pluckSnappedY: number | null;
  pluckPitch: string | null;
  picker: PickerState | null;
  vibration: VibrationState | null;
  blink: MetronomeBlinkState | null;
  /** 디버그: Shift+S 누르고 있는 동안만 true. 음표 hit rect를 빨간 반투명으로 표시. */
  debugShowHits: boolean;
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
    debugShowHits: false,
  };
}
