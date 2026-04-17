---
version: 1
last_verified: 2026-04-17
---

# 의존성 관리 (C3)

## When to Apply
- `package.json`에 의존성을 추가, 제거, 버전 변경할 때
- 패키지 간 import 관계를 새로 만들거나 변경할 때
- `pnpm-workspace.yaml`을 수정할 때

## MUST
- 워크스페이스 내부 패키지 참조는 `workspace:*` 프로토콜로 선언한다
- 라이브러리 패키지가 호스트에 위임해야 하는 의존성(예: `react`, `vue`)은 `peerDependencies`로 선언한다
- 빌드/테스트/린트용 도구는 `devDependencies`에 선언한다
- 런타임에 실제로 import되는 의존성만 `dependencies`에 둔다
- 의존성 방향은 레이어를 준수한다: `website/`·`docs/` → `packages/*` → `configs/*`. 역방향 금지

## MUST NOT
- 순환 의존(A → B → A)을 만들지 않는다
- 내부 공용 패키지(configs, tsconfig, eslint)가 라이브러리 패키지를 의존하지 않는다
- 루트 `package.json`에 런타임 의존성을 선언하지 않는다 (도구 의존성만 허용)
- 동일한 라이브러리를 여러 메이저 버전으로 동시에 의존하지 않는다

## PREFER
- 새 의존성 추가 전에 이미 다른 패키지가 유사 기능을 가진 의존성을 사용 중인지 확인한다
- peer 범위는 가능한 한 관대하게(`>=`) 지정한다
