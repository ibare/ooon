# @oon/player-web

Oon DSL 인터랙티브 블록 플레이어. DSL 소스 한 줄로 캔버스 렌더링 + 재생 컨트롤 + 트랙 mute UI + 오디오 엔진까지 통합한 vanilla TS 컨테이너.

## 사용

```ts
import { mount } from '@oon/player-web';

const handle = mount(document.getElementById('player')!, {
  source: 'song 4/4 key:C bpm:100\n  beat: 8beat-rock\n  C | G | Am | F |\n  C4/w | D4/w | E4/w | F4/w |',
});

// later
handle.dispose();
```

## 책임 범위

이 패키지는 다음을 자체적으로 처리한다:

- DSL 파싱 (`@oon/core`)
- 레이아웃 계산 (`@oon/composition` / `@oon/score-engraving` / `@oon/instrument-layouts`)
- 캔버스 렌더링 (`@oon/projector-web`)
- ResizeObserver 기반 자동 fit (`contentScale`)
- 재생 RAF 루프 + playhead/키보드 하이라이트/드럼 hit 시각화
- 오디오 엔진 lazy 생성 (smplr 기반, host 주입 불필요)
- PlayButton + 트랙 chip(코드/멜로디/비트) UI (Song 한정)
- 트랙별 mute 즉시 반영

호스트는 DSL 소스 문자열만 제공하면 된다.

## 옵션

- `source: string` 또는 `node: BlockNode` 중 하나 — DSL 입력
- `width?: number` — 작성자 의도 콘텐츠 폭. 미지정 시 컨테이너 폭 자동.
- `showNoteNames?: boolean` — score 음표 이름 표시
- `samplesBaseUrl?: string` — 오디오 샘플 base URL. 미지정 시 `'samples'` (host base 상대).
- `labels?: PlayerLabels` — 컨트롤 라벨 i18n
- `hideControls?: boolean` — 컨트롤 바 숨김(헤드리스)
- `onPlayingChange?: (playing: boolean) => void`

## 핸들

- `play(): Promise<void>`
- `stop(): void`
- `setMute(mute: TrackMute): void`
- `dispose(): void`
