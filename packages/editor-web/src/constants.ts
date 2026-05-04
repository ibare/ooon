// 편집 UX에서 사용하는 매직 상수 모음.
// 픽셀 단위는 layout 좌표계(논리 좌표) 기준이며, projector가 DPR 스케일을 처리한다.

// 박자 오버레이 — 큰박(그룹)과 작은박(슬롯)의 포함 관계를 색상 농도 nesting으로 표현.
// outer(진한 반투명 파랑) = 그룹 union, inner(옅은 반투명 파랑) = 그룹 안에 inset된 슬롯.
// 둘 다 반투명이라 오선지가 그대로 비치는 것이 오버레이의 기본 원칙. 알파 누적으로 inner가
// 더 진해지는 문제는 draw-overlay에서 destination-out으로 outer를 inner 영역에서 punch한 뒤
// inner를 그려 회피한다(누적 없이 inner 알파만 보임 → inner > outer 밝기 위계 유지).
export const BEAT_OVERLAY_OUTER_FILL = 'rgba(56, 132, 255, 0.45)';
export const BEAT_OVERLAY_INNER_FILL = 'rgba(56, 132, 255, 0.20)';
export const BEAT_OVERLAY_BLINK_FILL = 'rgba(56, 132, 255, 0.85)';
export const BEAT_OVERLAY_BLINK_MS = 220;

// 그룹 사이 갭(좌·우 GAP/2씩 inset).
export const BEAT_GROUP_GAP = 12;
// 슬롯 inset — 위계: 그룹 갭(12) > 슬롯 사이 갭(EDGE_INSET 미적용 슬롯 사이 = MID*2 = 8) > inner.
// 그룹 첫·마지막 슬롯은 EDGE_INSET를 적용해 outer 그룹 좌/우 안쪽으로 충분히 padding되어 보이도록 한다.
export const BEAT_SLOT_INSET_Y = 3;
export const BEAT_SLOT_INSET_MID = 4;
export const BEAT_SLOT_INSET_EDGE = 10;

// 슬롯 hit 영역은 시각(staff 안쪽)보다 위·아래로 ledger N개 분량 확장한다. ghost note preview가
// 오선 위/아래 음(ledger 영역)도 자유롭게 가리키도록 하기 위함. 시각(BEAT_OVERLAY) 그리기는
// 그대로 staff 안쪽만 사용 — 확장은 인터랙션 전용.
export const SLOT_HIT_LEDGER_LINES = 4;

// Ghost note preview — 슬롯 hover 또는 픽커 hover 중 마우스 Y에 해당하는 음표 모양을 회색
// 반투명으로 미리 그려 "여기에 추가됩니다"를 시각화. 실제 음표보다 옅게 표시해 구분.
export const GHOST_NOTE_FILL = 'rgba(120, 120, 120, 0.55)';
export const GHOST_LEDGER_STROKE = 'rgba(120, 120, 120, 0.45)';
export const GHOST_LEDGER_THICKNESS = 1.2;
// 점음표 점은 노트헤드 우측 ~1.5sp. ghost 시각 큐 용도라 정확한 SMUFL anchorAugmentationDot
// 계산은 생략하고 상수 offset 사용.
export const GHOST_DOT_OFFSET_SP = 1.5;

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

// 픽커 상단 카테고리 토글 바 — 세그먼티드 컨트롤(iOS/macOS 스타일).
// 외곽 트랙(둥근 캡슐) 안에 셀들이 gap 없이 붙어 있고, 활성 셀만 안쪽으로 inset된 밝은
// 배경 + 작은 borderRadius로 강조된다. 비활성 셀은 트랙 색이 그대로 비치고, hover 시에만
// 옅게 강조. 토글 동작은 외부 reducer가 담당하며, 위젯은 시각만 반영.
export const PICKER_TOGGLE_HEIGHT = 22;
// 토글 셀 폭 — 한국어 라벨("점쉼표" 3글자, 10px 폰트) 기준 좌우 여유 ≈10px.
// 짧은 라벨도 시각적 균일을 위해 동일 폭.
export const PICKER_TOGGLE_WIDTH = 40;
// 토글 라벨 폰트 크기. 시스템 폰트(한국어 sans).
export const PICKER_TOGGLE_LABEL_SIZE = 10;
// 트랙 외곽 — 패널보다 살짝 어두운 톤 + 옅은 테두리로 깊이감을 준다.
export const PICKER_TOGGLE_TRACK_BG = 'rgba(0, 0, 0, 0.30)';
export const PICKER_TOGGLE_TRACK_BORDER = 'rgba(255, 255, 255, 0.08)';
// 트랙 안쪽 padding — 활성 셀의 inset 두께(상하/좌우 동일).
export const PICKER_TOGGLE_TRACK_PAD = 2;
// 트랙 외곽 radius. 셀 inset radius는 그보다 작게(=track radius - track pad) 두면 동심.
export const PICKER_TOGGLE_TRACK_RADIUS = 8;
export const PICKER_TOGGLE_ACTIVE_RADIUS = 5;
export const PICKER_TOGGLE_HOVER_BG = 'rgba(255, 255, 255, 0.06)';
export const PICKER_TOGGLE_ACTIVE_BG = 'rgba(124, 196, 255, 0.35)';

// 픽커의 음정(pitch) 카테고리 — replace 컨텍스트에서 노출된다.
//   - ▲ / ▼ 셀: 단음/화음 음표를 반음 단위로 위/아래 이동 (transposeNote 커맨드).
//   - + 배지가 붙은 same-duration 음표 셀: 화음 head 추가 (addChordPitch 커맨드).
//   - ✕ 배지가 붙은 mini 노트헤드+pitch 라벨 셀: 화음에서 특정 head 제거 (removeChordHead).
// 모든 셀은 PICKER_TILE_SIZE 정사각, 캔버스 drawText로만 그리며 HTML overlay 없음.
//
// 음정 글리프 — Bravura가 지원하지 않는 화살표/배지는 시스템 폰트 유니코드 문자로 그린다.
export const PICKER_TRANSPOSE_UP_GLYPH = '▲'; // ▲ BLACK UP-POINTING TRIANGLE
export const PICKER_TRANSPOSE_DOWN_GLYPH = '▼'; // ▼ BLACK DOWN-POINTING TRIANGLE
export const PICKER_BADGE_ADD_GLYPH = '+';
export const PICKER_BADGE_REMOVE_GLYPH = '✕'; // ✕ MULTIPLICATION X
// ▲▼ 버튼은 picker 좌측 독립 컬럼이라 그리드 셀(PICKER_TILE_SIZE)보다 작게 — 보조 컨트롤
// 위계감을 시각적으로 분리. 정사각, 50% 축소.
export const PICKER_TRANSPOSE_TILE_SIZE = 20;
// ▲/▼ 글리프 폰트 크기. 위 타일 축소에 맞춰 함께 절반.
export const PICKER_TRANSPOSE_GLYPH_SIZE = 11;
// + / ✕ 배지 폰트 크기 — 셀 우상단 코너에 작게 부착.
export const PICKER_BADGE_FONT_SIZE = 12;
// 배지를 셀 우상단에서 안쪽으로 얼마나 padding할지(좌·상 동일 단위).
export const PICKER_BADGE_INSET = 5;
// removeChordHead 셀에 표시할 pitch 라벨(예: "C4") 폰트 크기. 셀 하단 가운데 정렬.
export const PICKER_HEAD_LABEL_FONT_SIZE = 10;
// 화음 head 한 개 추가 시 기본 추가 pitch는 "현재 최고음 + N semitone".
// 4 = 장3도(major third) — 가장 흔한 chord 인터벌. 사용자는 이후 ▲▼/제거로 수정.
export const PICKER_DEFAULT_CHORD_INTERVAL_SEMITONES = 4;

// 픽커 옵션 hover 시 그 옵션이 차지할 박자 영역을 미리 보여주는 핑크 반투명. 박자 슬롯과
// 같은 영역(staff top~bottom, 시작 박자~끝 박자)에 fill로 깔린다.
export const PREVIEW_OCCUPANCY_FILL = 'rgba(236, 72, 153, 0.30)';

// 마디 추가(+) 버튼 — 마지막 시스템의 마지막 바 우측 barlineX 옆에 원형 + 글리프로 표시.
// 클릭 시 score 끝에 빈 마디 한 개를 추가한다. radius는 hit/그리기 공통 기준.
export const ADD_BAR_BUTTON_RADIUS = 11;
export const ADD_BAR_BUTTON_GAP = 8;
export const ADD_BAR_BUTTON_FILL = 'rgba(56, 132, 255, 0.18)';
export const ADD_BAR_BUTTON_FILL_HOVER = 'rgba(56, 132, 255, 0.40)';
export const ADD_BAR_BUTTON_STROKE = 'rgba(56, 132, 255, 0.70)';
export const ADD_BAR_BUTTON_STROKE_HOVER = 'rgba(56, 132, 255, 1.00)';
export const ADD_BAR_BUTTON_GLYPH = 'rgba(245, 245, 248, 0.95)';
// + 글리프 십자선 두께/길이 비율 (radius 기준)
export const ADD_BAR_BUTTON_GLYPH_THICKNESS = 2;
export const ADD_BAR_BUTTON_GLYPH_LENGTH_RATIO = 0.55;
