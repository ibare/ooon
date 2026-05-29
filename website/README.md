# @ooon/website

Ooon 공개 사이트. `https://<user>.github.io/ooon/`에 GitHub Pages로 호스팅된다.

## 개발

```bash
pnpm install
pnpm --filter @ooon/website dev
```

`dev` / `build`는 `scripts/copy-bravura.ts`를 먼저 실행해 `@vexflow-fonts/bravura` 패키지의 WOFF2 파일을 `public/fonts/`로 복사한다.

## 구조

- `src/main.tsx` — 엔트리. BrowserRouter `basename='/ooon/'`
- `src/App.tsx` — 언어 감지/라우팅
- `src/i18n/` — 한국어/영어 딕셔너리 + Context
- `src/layout/` — Nav / Footer
- `src/pages/` — Home / Examples / Syntax
- `src/data/` — 예제·문법 정적 데이터
- `public/fonts/Bravura.woff2` — prebuild 스크립트가 복사

## 배포

`main` 브랜치에 push하면 `.github/workflows/deploy-website.yml`이 빌드해 GitHub Pages로 배포한다.
