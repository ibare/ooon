---
version: 1
last_verified: 2026-04-17
---

# Public API 관리 (C2)

## When to Apply
- 패키지에서 심볼을 export하거나 다른 패키지에서 import할 때
- `index.ts`를 수정할 때
- `package.json`의 `exports`, `main`, `module`, `types` 필드를 수정할 때

## MUST
- 외부 노출 심볼은 반드시 해당 패키지의 `src/index.ts`에서 re-export한다
- 다른 패키지를 사용할 때는 패키지 이름(`@ooon/foo`)으로만 import한다
- `package.json`의 `exports` 필드로 공개 진입점을 명시한다 (`main`/`module`/`types`는 하위 호환용으로만 병기)
- 공개되는 타입은 `.d.ts`로 배포한다 (빌드 산출물에 타입 선언 포함)
- 공개 API의 네이밍은 kebab-case 서브패스(`@ooon/foo/utils`)로 표현한다

## MUST NOT
- 다른 패키지의 내부 경로를 직접 import하지 않는다 (`@ooon/foo/src/internal/x` 금지)
- 상대 경로로 패키지 경계를 넘지 않는다 (`../../other-package/...` 금지)
- `index.ts`에서 `export *`로 의도하지 않은 심볼까지 노출하지 않는다. 명시적 export 이름을 사용한다
- 공개 API에 내부 타입(implementation detail)을 노출하지 않는다

## PREFER
- 타입과 값은 분리하여 export한다 (`export type { ... }`)
- barrel 파일은 한 패키지에 하나(`src/index.ts`)만 둔다. 서브패스가 필요하면 `exports` 필드로 제한적으로 허용한다
