import type { BeatSlotRect } from '../geometry/beat-overlay.js';
import type { PluckZoneRect } from '../geometry/pluck-zone.js';
import type { PickerOption } from '../geometry/picker-options.js';

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

// 모든 picker state가 공유하는 anchor·콘텐츠 영역·카테고리/hover 상태.
// anchor는 picker 외곽의 좌상단 좌표. paint/hitTest 시점에 위젯 트리를 빌드하고
// 콘텐츠 영역에 클램프해 절대 위치를 결정한다(매번 결정적).
export interface PickerCommon {
  anchorX: number;
  anchorY: number;
  contentWidth: number;
  contentHeight: number;
  /** 위쪽 패드 활용을 위한 음수 허용 minY. 보통 -UI_CANVAS_PAD_TOP. */
  contentMinY: number;
  /** 활성 카테고리 id 집합. multi 모드면 여러 개, single이면 한 개. */
  active: ReadonlySet<string>;
  /** 현재 hover 중인 hit token. 'picker:cell:N' 또는 'picker:toggle:id'. */
  hoveredToken: string | null;
  /** picker open 시점에 build된 전체 옵션. paint/hitTest 시 active로 필터링되어 사용. */
  options: readonly PickerOption[];
}

// 빈 박자 슬롯에서 열린 픽커 — 새 음표/쉼표 삽입 컨텍스트.
export interface InsertPickerState extends PickerCommon {
  kind: 'insert';
  barIndex: number;
  beatIndex: number;
  pitch: string; // 자동: 보표 중앙 라인의 step 기준(B4)
}

// 기존 음표/쉼표를 클릭해 열린 픽커 — 같은 자리의 duration/종류 교체 컨텍스트.
export interface ReplacePickerState extends PickerCommon {
  kind: 'replace';
  barIndex: number;
  noteIndex: number;
  /** 클릭한 음표의 마디 내 시작 박자 위치(이전 음표들 beats 누적). 점유 미리보기에 사용. */
  startBeat: number;
}

// 박자표 클릭으로 열린 픽커 — 박자 교체. 변경 시 마디 초기화 부작용이 있어
// 명시적 클릭 컨텍스트(박자표)에서만 트리거된다.
export interface TimeSigPickerState extends PickerCommon {
  kind: 'timeSig';
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
  /** 마지막 마디 우측 + 버튼 hover 여부 — 그리기 색상/cursor 토글에 사용. */
  hoveredAddBar: boolean;
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
    hoveredAddBar: false,
    debugShowHits: false,
  };
}
