---
version: 1
last_verified: 2026-04-17
---

# 에러 처리와 전파 (C6)

## When to Apply
- `try/catch`, `throw`, `Promise.reject`, `.catch()`를 작성 또는 수정할 때
- 공개 API의 실패 경로를 정의할 때

## MUST
- 라이브러리 코드에서 포착한 에러는 재전파하거나 의미 있는 에러 타입으로 래핑하여 전파한다
- 공개 API가 던질 수 있는 에러는 타입/문서에 명시한다
- 도메인 에러는 `Error`를 상속한 명명된 클래스로 정의한다
- 비동기 경로에서 에러가 삼켜지지 않도록 모든 Promise는 `await` 또는 명시적 `.catch`로 처리한다

## MUST NOT
- 에러를 catch 후 로깅만 하고 침묵시키지 않는다 (catch-and-ignore 금지)
- 사용자 입력/외부 응답이 아닌 내부 호출에 대해 방어적 `try/catch`로 분기를 만들지 않는다 (내부 계약을 신뢰한다)
- 문자열이나 plain object를 `throw`하지 않는다. 반드시 `Error` 또는 그 하위 타입을 사용한다
- 원본 에러의 스택/원인을 소실시키지 않는다 (`throw new Error("...")`로 덮어쓰지 말고 `cause`를 사용한다)

## PREFER
- 예측 가능한 실패는 `Result`/union 타입으로 값으로 반환하고, 예외는 예외적인 상황에만 사용한다
- 에러 메시지에 상황 재현에 필요한 식별자/컨텍스트를 포함한다
