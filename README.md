# Oon(운)

음악 DSL 렌더러. 텍스트로 기술된 음악 요소를 인터랙티브 시각화와 소리로 렌더링한다.

## 패키지

| 패키지 | 설명 |
|--------|------|
| [`@oon/shared`](packages/shared) | 공유 타입/인터페이스 (Projector, AudioEngine) |
| [`@oon/core`](packages/core) | DSL 파서 + AST + 음악 이론 + 레이아웃 (플랫폼 독립) |
| [`@oon/projector-web`](packages/projector-web) | 웹 Canvas 렌더러 + smplr 오디오 엔진 |
| [`@oon/plugin-tiptap`](packages/plugin-tiptap) | Tiptap 에디터 확장 |

## 개발

```bash
pnpm install
pnpm build
pnpm test
pnpm dev           # 데모 앱 실행
```

## 설계 원리

1. 표기법 자체가 인터페이스 — DSL이 탐색의 시작점
2. "이걸 바꾸면 무슨 일이 일어나는가"가 가장 강력한 학습
3. 즉각적 시각/청각 피드백이 이해를 만든다
4. 서비스가 아니라 도구
5. DSL은 의미만 기술, 시각/소리는 도구가 맥락에 맞게 선택
