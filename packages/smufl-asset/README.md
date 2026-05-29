# @ooon/smufl-asset

SMuFL(Standard Music Font Layout) 자산. Bravura 폰트와 그 메타데이터에서 추출한 글리프·조판 기본값을 타입 안전하게 노출한다.

이 패키지는 **데이터 소스**일 뿐 렌더링 로직을 갖지 않는다. 좌표는 SMuFL 명세대로 staff space(sp) 단위 그대로 보존한다(1 sp = 보표 한 칸, 1 em = 4 sp).

## 공개 API

```ts
import { GLYPHS, ENGRAVING, BRAVURA_FONT_FAMILY } from '@ooon/smufl-asset';
import type { Sp, GlyphName, GlyphInfo, EngravingDefaults } from '@ooon/smufl-asset';
```

- `GLYPHS[name]`: 각 글리프의 `codepoint`, `bbox`(좌상우하, sp), `anchors`(stemUpSE/stemDownNW 등, sp). y축은 위가 양수(SMuFL 규약).
- `ENGRAVING`: staffLineThickness, stemThickness, beamThickness 등 표준 키. 모두 sp 단위.
- `BRAVURA_FONT_FAMILY`: `'Bravura'`.

폰트 파일은 서브패스로 노출한다.

```ts
// Vite 등 번들러에서:
import bravuraFontUrl from '@ooon/smufl-asset/font/Bravura.woff2?url';
```

## 디렉터리

- `src/index.ts` — 공개 API
- `src/types.ts` — `Sp`, `GlyphInfo`, `EngravingDefaults`
- `src/glyph-names.ts` — 사용 글리프 이름 → codepoint 매핑(엔진이 의존하는 단일 출처)
- `src/generated/glyph-table.ts` — `GLYPHS`, `ENGRAVING`. **수동 편집 금지.** `pnpm generate`로 재생성한다.
- `assets/bravura_metadata.json` — 추출 입력. 배포 제외.
- `assets/Bravura.woff2` — 런타임 폰트. 배포 포함.
- `assets/Bravura-OFL.txt` — Bravura SIL OFL 라이선스 사본.
- `scripts/extract-metadata.ts` — 빌드 입력 도구. `pnpm generate`로 실행해 `glyph-table.ts`를 갱신.

## 메타데이터 갱신

```bash
pnpm --filter @ooon/smufl-asset generate
```

`assets/bravura_metadata.json`이 갱신됐을 때만 실행한다. 결과는 결정적이며 git에 커밋된다.

## 라이선스

Bravura 폰트와 메타데이터는 Steinberg가 SIL Open Font License 1.1로 배포한다. `assets/Bravura-OFL.txt` 참고.
