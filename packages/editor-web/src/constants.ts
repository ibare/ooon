// 편집 UX에서 사용하는 매직 상수 모음.
// 픽셀 단위는 layout 좌표계(논리 좌표) 기준이며, projector가 DPR 스케일을 처리한다.

// 박자 오버레이 — 큰박(그룹)과 작은박(슬롯)의 포함 관계를 색상 농도 nesting으로 표현.
// outer(진한 반투명 파랑) = 그룹 union, inner(옅은 반투명 파랑) = 그룹 안에 inset된 슬롯.
// 둘 다 반투명이라 오선지가 그대로 비치는 것이 오버레이의 기본 원칙. 알파 누적으로 inner가
// 더 진해지는 문제는 draw-overlay에서 destination-out으로 outer를 inner 영역에서 punch한 뒤
// inner를 그려 회피한다(누적 없이 inner 알파만 보임 → inner > outer 밝기 위계 유지).
export const BEAT_OVERLAY_OUTER_FILL = 'rgba(56, 132, 255, 0.45)';
export const BEAT_OVERLAY_INNER_FILL = 'rgba(56, 132, 255, 0.20)';
export const BEAT_OVERLAY_HOVER_FILL = 'rgba(56, 132, 255, 0.65)';
export const BEAT_OVERLAY_BLINK_FILL = 'rgba(56, 132, 255, 0.85)';
export const BEAT_OVERLAY_BLINK_MS = 220;

// 그룹 사이 갭(좌·우 GAP/2씩 inset).
export const BEAT_GROUP_GAP = 12;
// 슬롯 inset — 위계: 그룹 갭(12) > 슬롯 사이 갭(EDGE_INSET 미적용 슬롯 사이 = MID*2 = 8) > inner.
// 그룹 첫·마지막 슬롯은 EDGE_INSET를 적용해 outer 그룹 좌/우 안쪽으로 충분히 padding되어 보이도록 한다.
export const BEAT_SLOT_INSET_Y = 3;
export const BEAT_SLOT_INSET_MID = 4;
export const BEAT_SLOT_INSET_EDGE = 10;

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
// 박자 picker 셀 내부 상하 padding. 두 글리프(분자/분모)가 셀 안에 padding을 두고 위·아래로
// 나눠 가지므로, fontSize는 (TILE_SIZE - PAD*2)/2 로 도출된다 — 매직 비율 곱 대신 셀 크기에서.
export const PICKER_TIMESIG_INTERNAL_PAD = 4;
export const PICKER_BG = 'rgba(20, 22, 28, 0.94)';
export const PICKER_BORDER = 'rgba(255, 255, 255, 0.18)';
export const PICKER_TEXT = 'rgba(245, 245, 248, 0.95)';
export const PICKER_HOVER_BG = 'rgba(124, 196, 255, 0.20)';
export const PICKER_EMPTY_BG = 'rgba(255, 255, 255, 0.04)';
// 픽커는 클릭 위치(staff 안쪽)에서 펼쳐지면 오선지를 가리므로, anchorY는 클릭 위치가 아니라
// 그 시스템의 staff.bottom 아래 GAP 만큼 떨어진 위치로 둔다. anchorX(가로)는 그대로 유지.
export const PICKER_BELOW_STAFF_GAP = 8;

// 픽커 옵션 hover 시 그 옵션이 차지할 박자 영역을 미리 보여주는 핑크 반투명. 박자 슬롯과
// 같은 영역(staff top~bottom, 시작 박자~끝 박자)에 fill로 깔린다.
export const PREVIEW_OCCUPANCY_FILL = 'rgba(236, 72, 153, 0.30)';
