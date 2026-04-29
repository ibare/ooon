# @oon/instrument-layouts

악기별 레이아웃 계산기. AST 노드를 받아 화면 좌표로 풀어낸 layout 객체를 반환한다.

- `calculateKeyboardLayout` — 88건반 또는 강조 키 단일/연속 표시
- `calculateFretboardLayout` — 6현 프렛보드의 줄·프렛·점 좌표
- `calculateDrumLayout` — 드럼 트랙 셀 그리드
- `calculateProgressionLayout` — 코드 진행 카드 그리드

각 layout은 순수 함수이며 렌더러와 분리된다. 픽셀 단위는 `width`/옵션으로 결정되고 시각적 표현은 `@oon/projector-web` 등 렌더러 측에서 담당한다.
