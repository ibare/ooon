import type { GlyphName } from '@oon/core';
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
  pitch: string; // 슬롯 클릭 시점 마우스 Y → pitchAt으로 결정.
  /** 슬롯 클릭 시점에 동결된 ghost 좌표 — 픽커 열려 있는 동안 ghost는 이 위치에 anchored. */
  ghostX: number;
  ghostSnappedY: number;
  /** ghost ledger line 그릴 때 staff 정보 lookup용. */
  systemIndex: number;
}

// 기존 음표/쉼표를 클릭해 열린 픽커 — 같은 자리의 duration/종류 교체 컨텍스트.
export interface ReplacePickerState extends PickerCommon {
  kind: 'replace';
  barIndex: number;
  noteIndex: number;
  /** 클릭한 음표의 마디 내 시작 박자 위치(이전 음표들 beats 누적). 점유 미리보기에 사용. */
  startBeat: number;
  /**
   * 클릭한 음표의 현재 pitches 스냅샷. 쉼표면 빈 배열.
   * 두 가지 용도:
   *  1) ▲▼ transpose 컬럼 노출 여부 판정(length>0일 때만 노출)
   *  2) ▲▼ 클릭으로 음표가 이동했을 때 picker.options(특히 RemoveChordHead/AddChordPitch)를
   *     동일 위치 음표 스냅샷으로 재계산.
   */
  currentPitches: readonly string[];
  /** 클릭한 음표의 duration symbol — ▲▼ 후 옵션 재계산 시 같은 시그니처 유지에 사용. */
  currentDuration: string;
  /** 클릭한 음표가 쉼표인지 — 옵션 재계산 시 동일 컨텍스트 유지에 사용. */
  currentIsRest: boolean;
}

// 박자표 클릭으로 열린 픽커 — 박자 교체. 변경 시 마디 초기화 부작용이 있어
// 명시적 클릭 컨텍스트(박자표)에서만 트리거된다.
export interface TimeSigPickerState extends PickerCommon {
  kind: 'timeSig';
}

export type PickerState = InsertPickerState | ReplacePickerState | TimeSigPickerState;

// "여기에 추가됩니다" 시각 미리보기. 슬롯 hover 시 마우스 Y에 따라 노트헤드 ghost를 띄우고,
// 픽커가 열린 후에는 anchored 좌표에 고정되어 픽커 hover 옵션 모양으로 글리프만 교체된다.
// 픽커 hover가 쉼표/박자표면 ghost는 null로 숨김(이미 박자 점유 핑크 미리보기가 있음).
export interface GhostPreview {
  /** 노트헤드 좌측 anchor x (slot.x + slot.width/2 등 슬롯 기준 가운데 정렬). */
  x: number;
  /** 노트헤드 중심 y (pitchAt의 snappedY 결과). */
  snappedY: number;
  /** 표시할 글리프. 슬롯 hover만 한 상태면 'noteheadBlack', 픽커 hover면 옵션의 결합 글리프. */
  glyph: GlyphName;
  /** 점음표 미리보기면 노트헤드 우측 augmentationDot도 표시. */
  dotted: boolean;
  /** ledger line 계산을 위해 staff(lineGap/top/bottom) lookup에 사용. */
  systemIndex: number;
}

export interface EditorState {
  mode: EditorMode;
  hoveredZone: PluckZoneRect | null;
  pluckSnappedY: number | null;
  pluckPitch: string | null;
  picker: PickerState | null;
  /** 슬롯/픽커 hover 시 표시할 ghost note. null이면 표시 안 함. */
  ghostPreview: GhostPreview | null;
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
    hoveredZone: null,
    pluckSnappedY: null,
    pluckPitch: null,
    picker: null,
    ghostPreview: null,
    vibration: null,
    blink: null,
    hoveredAddBar: false,
    debugShowHits: false,
  };
}
