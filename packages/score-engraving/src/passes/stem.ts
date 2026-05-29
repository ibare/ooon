import { GLYPHS, type GlyphName } from '@ooon/smufl-asset';

// SMuFL 좌표계: y가 위로 양수. 화면 좌표계는 y가 아래로 양수 → anchor.y에 부호 반전.

export interface StemContext {
  pxPerSp: number;
  stemLengthSp: number; // 표준 3.5 sp
}

export interface StemPlacement {
  x: number;
  y1: number; // 노트헤드에 붙는 끝
  y2: number; // 깃발/빔이 붙는 끝
  direction: 'up' | 'down';
}

// step과 B4 step을 비교해 방향을 결정. B4 이상은 down(컨벤션상 B4 자체는 down).
export function stemDirection(step: number, b4Step: number): 'up' | 'down' {
  return step >= b4Step ? 'down' : 'up';
}

// 머리 글리프 이름과 노트헤드 (x, y)를 받아 stem 좌표를 산출한다.
// 결과의 (x, y1)은 노트헤드의 stemUpSE/stemDownNW 앵커 위치.
export function placeStem(
  headGlyph: GlyphName,
  noteX: number,
  noteY: number,
  direction: 'up' | 'down',
  ctx: StemContext,
): StemPlacement {
  const info = GLYPHS[headGlyph];
  const anchorKey = direction === 'up' ? 'stemUpSE' : 'stemDownNW';
  const anchor = info.anchors[anchorKey];
  // notehead 글리프에 anchor가 없을 가능성은 자산 추출 단계에서 차단되지만, 보수적으로 fallback.
  const ax = anchor?.x ?? 0;
  const ay = anchor?.y ?? 0;
  const x = noteX + ax * ctx.pxPerSp;
  const y1 = noteY - ay * ctx.pxPerSp;
  const stemLenPx = ctx.stemLengthSp * ctx.pxPerSp;
  const y2 = direction === 'up' ? y1 - stemLenPx : y1 + stemLenPx;
  return { x, y1, y2, direction };
}
