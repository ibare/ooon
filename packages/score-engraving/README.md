# @ooon/score-engraving

SMuFL 기반 악보 식자(engraving). AST의 `score`/`song` 노드를 받아 보표·음표·스템·빔·임시표·조표 등을 픽셀 좌표로 풀어낸 layout을 계산한다.

- `calculateScoreLayout` — 단일 score 블록 layout
- `calculateSongLayout` — chord row + score row + (선택) drum row가 수직 적층된 song layout
- `passes/*` — 임시표 결정, 조표, 수직 배치, 스템, 빔 그룹화, 수평 spacing

좌표 단위는 SMuFL 명세대로 staff space(sp)이며, 마지막 변환 단계에서만 `pxPerSp`로 px 변환된다.
