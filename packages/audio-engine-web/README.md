# @ooon/audio-engine-web

`@ooon/shared`의 `AudioEngine` 인터페이스를 [smplr](https://github.com/danigb/smplr) 라이브러리 기반으로 구현한 웹 어댑터.

## 위치

- 시각화 패키지(`@ooon/projector-web`)도 아니고 재생기 패키지(`@ooon/player-web`)도 아니다 — 단순히 "smplr를 AudioEngine으로 감싼 한 클래스"만 보유한다.
- `@ooon/player-web`(블록 재생), `@ooon/editor-web`(편집기 단음 미리듣기), `@ooon/tiptap`(노드 런타임) 등 **AudioEngine을 사용하는 모든 패키지**가 이 어댑터를 공유한다.

## 사용

```ts
import { SmplrAudioEngine } from '@ooon/audio-engine-web';

const engine = new SmplrAudioEngine({
  pianoBaseUrl: '/samples/splendid-grand-piano',
  drumKitUrl: '/samples/drum-machines/tr-808/dm.json',
});
await engine.init();
engine.playNote('C4', 'q');
```

`smplr`은 peer dependency다. 호스트 앱이 직접 의존성으로 선언해야 한다.
