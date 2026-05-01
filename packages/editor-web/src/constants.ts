// 편집 UX에서 사용하는 매직 상수 모음.
// 픽셀 단위는 layout 좌표계(논리 좌표) 기준이며, projector가 DPR 스케일을 처리한다.

// 박자 오버레이
export const BEAT_OVERLAY_FILL = 'rgba(56, 132, 255, 0.08)';
export const BEAT_OVERLAY_STROKE = 'rgba(56, 132, 255, 0.45)';
export const BEAT_OVERLAY_HOVER_FILL = 'rgba(56, 132, 255, 0.18)';
export const BEAT_OVERLAY_BLINK_FILL = 'rgba(56, 132, 255, 0.55)';
export const BEAT_OVERLAY_BLINK_MS = 220;

// 박자 그룹 경계 점선 — 빈 영역에서 음악적 메인박 그룹의 시작 위치를 시각화.
// 음표가 채워진 마디는 beam grouping이 그룹을 표현하므로 별도 점선 없이 살아남.
export const BEAT_GROUP_BOUNDARY_COLOR = 'rgba(56, 132, 255, 0.55)';
export const BEAT_GROUP_BOUNDARY_DASH: readonly [number, number] = [3, 3];
export const BEAT_GROUP_BOUNDARY_LINE_WIDTH = 1;

// 메트로놈 클릭(WebAudio)
export const METRONOME_CLICK_FREQ_HZ = 1500;
export const METRONOME_CLICK_DECAY_SEC = 0.05;
export const METRONOME_CLICK_GAIN = 0.25;

// 오선 튕기기 zone
export const PLUCK_ZONE_WIDTH = 28;
export const PLUCK_ZONE_GAP_FROM_BARLINE = 6;
export const PLUCK_ZONE_HOVER_FILL = 'rgba(255, 196, 0, 0.10)';
export const PLUCK_ZONE_HIGHLIGHT_STROKE = 'rgba(255, 140, 0, 0.85)';

// 진동 애니메이션 (감쇠 사인파)
export const VIBRATION_AMPLITUDE_PX = 2.5;
export const VIBRATION_FREQ_HZ = 12;
export const VIBRATION_DECAY_SEC = 0.55;

// UI 오버레이 캔버스 패드 (score 캔버스 위/아래로 확장되는 투명 영역, 픽커 등 UI 표시 공간)
export const UI_CANVAS_PAD_TOP = 150;
export const UI_CANVAS_PAD_BOTTOM = 150;

// 노트 픽커 (5x5 정사각 타일 그리드)
export const PICKER_PADDING = 8;
export const PICKER_TILE_SIZE = 40;
export const PICKER_TILE_GAP = 4;
export const PICKER_GLYPH_SIZE = 28;
export const PICKER_BG = 'rgba(20, 22, 28, 0.94)';
export const PICKER_BORDER = 'rgba(255, 255, 255, 0.18)';
export const PICKER_TEXT = 'rgba(245, 245, 248, 0.95)';
export const PICKER_HOVER_BG = 'rgba(124, 196, 255, 0.20)';
export const PICKER_EMPTY_BG = 'rgba(255, 255, 255, 0.04)';
