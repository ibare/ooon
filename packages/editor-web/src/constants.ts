// 편집 UX에서 사용하는 매직 상수 모음.
// 픽셀 단위는 layout 좌표계(논리 좌표) 기준이며, projector가 DPR 스케일을 처리한다.

// 박자 오버레이
export const BEAT_OVERLAY_FILL = 'rgba(56, 132, 255, 0.08)';
export const BEAT_OVERLAY_STROKE = 'rgba(56, 132, 255, 0.45)';
export const BEAT_OVERLAY_HOVER_FILL = 'rgba(56, 132, 255, 0.18)';
export const BEAT_OVERLAY_BLINK_FILL = 'rgba(56, 132, 255, 0.55)';
export const BEAT_OVERLAY_BLINK_MS = 220;

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

// 노트 픽커
export const PICKER_PADDING = 8;
export const PICKER_ITEM_HEIGHT = 26;
export const PICKER_ITEM_GAP = 4;
export const PICKER_BG = 'rgba(20, 22, 28, 0.94)';
export const PICKER_BORDER = 'rgba(255, 255, 255, 0.18)';
export const PICKER_TEXT = 'rgba(245, 245, 248, 0.95)';
export const PICKER_BAR_BG = 'rgba(255, 255, 255, 0.12)';
export const PICKER_BAR_FG = 'rgba(124, 196, 255, 0.85)';
export const PICKER_HOVER_BG = 'rgba(124, 196, 255, 0.20)';
