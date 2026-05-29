# @ooon/projector-web

Ooon 웹 프로젝터. Canvas 2D로 DSL 블록(score / drum / progression / fretboard / song)을 그린다. 시각화 전담 패키지로, 오디오/타이밍은 외부에서 주입한다.

## 주요 API

- `mountBlockView(host, opts)` — 단일 블록을 자동 감지해 적절한 렌더러로 그리는 facade. `setSource`, `setMute`, `setPlayhead(beat)`로 외부에서 제어.
- `CanvasProjector`, `loadBravura` 등 저수준 렌더 빌딩 블록.

## 책임 분리

- 오디오 엔진(smplr 어댑터): `@ooon/audio-engine-web`
- 재생 컨트롤 + 오디오 오케스트레이션: `@ooon/player-web`
- 이 패키지는 그리기만 담당한다.
