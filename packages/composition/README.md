# @oon/composition

여러 악기 layout을 수직으로 적층하는 합성 레이아웃 계산기. 현재는 song layout(코드 진행 + 악보 + 드럼)을 제공한다.

- `calculateSongLayout` — chord row, score row, (선택) drum row를 세로로 합쳐 단일 SongLayout으로 반환

`@oon/score-engraving`(악보 식자), `@oon/instrument-layouts`(악기별 레이아웃)을 조합하므로 두 패키지를 함께 의존한다.
