---
version: 1
last_verified: 2026-04-17
---

# 빌드와 배포 (C4)

## When to Apply
- 빌드 설정(`tsconfig.json`, 번들러 설정)을 수정할 때
- `package.json`의 `exports`, `files`, `main`, `module`, `types`, `scripts` 필드를 수정할 때
- 배포 파이프라인(릴리스 스크립트, CI)을 수정할 때

## MUST
- 배포 대상 패키지는 ESM과 타입 선언을 모두 포함한다 (`exports.import`, `exports.types`)
- `package.json`의 `files` 필드로 배포 포함 파일을 명시한다 (`dist`, `README.md`, `LICENSE`)
- 버전 관리는 semver를 따른다. breaking change는 major 버전을 올린다
- 빌드 산출물은 소스를 직접 import 가능한 형태로 배포하지 않는다 (`src/`를 `files`에 포함 금지)
- 루트 `package.json`은 `private: true`로 유지한다

## MUST NOT
- 배포용 `dist/`에 테스트 파일, 스냅샷, `*.test.*`, `*.spec.*`을 포함하지 않는다
- `devDependencies`에 선언된 것을 런타임 코드에서 import하지 않는다
- 배포 전에 lint/typecheck/test 모두 통과하지 않은 상태로 publish하지 않는다

## PREFER
- 배포 전 dry-run(`pnpm publish --dry-run` 등)으로 포함 파일 목록을 확인한다
- 변경 이력은 Changesets 등 도구로 관리한다
