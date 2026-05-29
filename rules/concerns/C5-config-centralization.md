---
version: 1
last_verified: 2026-04-17
---

# 설정 중앙화 (C5)

## When to Apply
- `tsconfig.json`, ESLint/Prettier 설정, 빌드 설정을 작성 또는 수정할 때
- 상수, 매직 넘버/스트링, 환경 변수 참조를 추가할 때

## MUST
- 공용 TypeScript 설정은 내부 패키지(예: `@ooon/tsconfig`)에서 `extends`로 상속한다
- 공용 ESLint 설정은 내부 패키지(예: `@ooon/eslint-config`)에서 import 또는 `extends`로 사용한다
- 매직 넘버/매직 스트링은 상수 모듈에 정의하고 이름으로 참조한다
- 환경 변수 접근은 단일 모듈(`env.ts` 등)에 모으고 그 모듈 외부에서는 `process.env.*`를 직접 참조하지 않는다

## MUST NOT
- 각 패키지마다 동일한 lint/tsconfig 규칙을 중복 복제하지 않는다
- `tsconfig.json`의 `compilerOptions`을 공용 설정과 모순되게 덮어쓰지 않는다 (확장 및 좁은 override만 허용)
- 비밀값(API 키, 토큰)을 소스 코드나 설정 파일에 하드코딩하지 않는다

## PREFER
- 공용 설정 패키지는 `composite`를 활용해 체인의 최상위에 둔다
- 상수는 도메인 단위로 나눠 불필요한 import 범위를 최소화한다
