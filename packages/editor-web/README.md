# @ooon/editor-web

Ooon 점수 편집기. 빈 악보 위에 박자 오버레이, 오선 튕기기, 음표 배치 픽커 UX를 캔버스로 구현한다.

## Architecture — 트리플 캔버스 stacking

`createScoreEditor`는 한 컨테이너 안에 세 개의 캔버스를 z-stack한다.

| layer | 역할 | pointer-events |
|---|---|---|
| `scoreCanvas` | 보표/오선/음표/박자표 등 본 score | `none` |
| `editCanvas` | 박자 오버레이/튕기기/진동/debug hits 등 편집 UX + 이벤트 수신 | `auto` |
| `uiCanvas` | picker 모달 (주변 DOM을 덮는 위·아래 패드 포함) | 평소 `none`, 모달 활성화 시 `auto` |

`editCanvas`는 `scoreCanvas`와 동일한 위치/크기/`contentScale`로 정렬되어 좌표계가 score와
동치이며, 박자 오버레이의 `destination-out` punch 같은 합성 효과가 본 score(오선)를 깎지 않도록
별도 transparent layer로 분리되어 있다. `uiCanvas`는 picker 같은 모달 UI 한정이며 비활성 상태에서
주변 DOM을 가리지 않도록 `pointer-events: none` 기본값으로 동작한다.

자세한 MUST / MUST NOT 규칙은 [`rules/specifics/S-editor-web-canvas.md`](../../rules/specifics/S-editor-web-canvas.md) 참고.
