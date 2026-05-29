# S-editor-web-canvas — editor-web 캔버스 stacking

`@ooon/editor-web`의 `score-editor.ts`는 트리플 캔버스 stacking으로 책임을 분리한다.
편집 UX의 합성 효과(예: `destination-out` punch)가 본 score 요소(오선 등)를 깎지 않도록
layer를 분리하는 것이 핵심.

## 캔버스 구성

| layer | 역할 | DOM | pointer-events |
|---|---|---|---|
| `scoreCanvas` | 보표/오선/음표/박자표 등 본 score 렌더 | DOM 흐름 안 (가장 아래 z) | `none` |
| `editCanvas` | 박자 오버레이/튕기기/진동/debug hits 등 편집 UX + 이벤트 수신 | absolute, score 위 | `auto` |
| `uiCanvas` | picker 모달 (위·아래 패드만큼 더 큰 모달 영역) | absolute, 가장 위 z | 평소 `none`, 모달 활성화 시 `auto` |

DOM 순서는 score → edit → ui (위로 갈수록 z-stack 위). `editCanvas`는 `scoreCanvas`와 동일한
`layout.width`/`layout.height`/`contentScale`로 동기 resize되어 좌표계 동치이며, `uiCanvas`는
주변 DOM을 덮을 수 있도록 위·아래 패드만큼 더 큰 콘텐츠 영역을 가진다.

## MUST

- **M1**: 사용자 hover/click 대상이 되는 편집 UX 그래픽은 `editCanvas`에 그린다.
- **M2**: 인터랙션 이벤트 핸들러(`pointermove`/`pointerdown`/cursor 등)는 `editCanvas`에 부착한다.
  모달 활성화 시 `uiCanvas` 추가 부착은 허용된다.
- **M3**: `destination-out`/`destination-in` 등 알파를 깎는 합성 모드(GlobalCompositeOperation)는
  `scoreCanvas`에서 사용 금지한다 — score 본 요소를 함께 깎는다. punch가 필요하면 `editCanvas`에서
  수행한다.
- **M4**: `editCanvas`와 `scoreCanvas`는 동일한 `layout.width`/`layout.height`/`contentScale`로
  동기 resize한다 (좌표계 동치 보장).

## MUST NOT

- `scoreCanvas`에 hover/click 이벤트 핸들러를 부착하지 않는다.
- `scoreCanvas.style.cursor`를 변경하지 않는다 — 위에 `editCanvas`가 가리므로 의미가 없을 뿐 아니라,
  cursor 결정 로직을 `scoreCanvas`로 끌어가는 신호가 된다.
- `uiCanvas`에 평소 표시되어야 하는 UI를 그리지 않는다 — `uiCanvas`는 모달 한정이며 활성화되지
  않았을 때 "없는 셈"으로 취급되어야 한다 (주변 DOM을 덮으므로).

## 배경

박자 오버레이 nesting 구현에서 `outer alpha + inner alpha` 누적으로 inner가 outer보다 진해지는
문제를 `destination-out`으로 inner 영역에서 outer를 punch해 해결하려 했으나, score와 overlay가
같은 캔버스에 그려지면 punch가 오선 픽셀까지 함께 깎아 슬롯 영역의 오선이 사라지는 회귀가
발생했다. 편집 UX layer를 score와 분리된 transparent 캔버스(`editCanvas`)로 떼어내면 같은 punch
트릭이 score에 무영향이 된다 — 같은 영역에 새로운 합성 효과를 추가하는 향후 작업에서도 동일한
구조적 안전이 보장된다.
