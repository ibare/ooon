import type { ScoreLayout } from '@oon/score-engraving';
import { ADD_BAR_BUTTON_GAP, ADD_BAR_BUTTON_RADIUS } from '../constants.js';

export interface AddBarHitRect {
  /** 버튼 중심 좌표(원형 그리기용) */
  cx: number;
  cy: number;
  /** 사각 hit area — 클릭 판정 + 디버그 표시용 (원의 외접 사각형) */
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
}

// 마지막 시스템의 마지막 바 우측 barlineX 옆에 + 버튼 hit rect를 산출한다.
// 빈 layout(시스템/바 없음)이면 null. 마디 추가가 의미 없는 상태는 호출자 책임이지만
// 안전을 위해 본 함수는 좌표만 계산한다.
//
// cy는 staff 세로 중앙(top과 bottom 평균). cx는 barlineX + GAP + radius로 마디 우측 바깥에
// 충분히 떨어뜨려 음표/박자 슬롯 클릭과 겹치지 않게 한다.
//
// cx + radius가 layout.width를 넘으면 layout.width 안쪽으로 클램프 — 마지막 시스템이
// 콘텐츠 폭을 가득 채운 경우에도 캔버스 우측 클립으로 사라지지 않도록 한다.
export function calculateAddBarHit(layout: ScoreLayout): AddBarHitRect | null {
  const lastSystem = layout.systems[layout.systems.length - 1];
  if (!lastSystem) return null;
  const lastBar = lastSystem.bars[lastSystem.bars.length - 1];
  if (!lastBar) return null;

  const radius = ADD_BAR_BUTTON_RADIUS;
  const cyCenter = (lastSystem.staff.top + lastSystem.staff.bottom) / 2;
  let cx = lastBar.barlineX + ADD_BAR_BUTTON_GAP + radius;
  if (cx + radius > layout.width) cx = layout.width - radius;

  return {
    cx,
    cy: cyCenter,
    x: cx - radius,
    y: cyCenter - radius,
    width: radius * 2,
    height: radius * 2,
    radius,
  };
}

export function findAddBarHitAt(
  hit: AddBarHitRect | null,
  x: number,
  y: number,
): AddBarHitRect | null {
  if (!hit) return null;
  // 사각 hit area로 판정 — 원형 안쪽 정밀도가 필요하면 dx² + dy² ≤ r²로 바꿀 수 있으나,
  // 외접 사각형도 충분한 fitts's law 타깃 크기를 보장한다.
  if (x < hit.x || x > hit.x + hit.width) return null;
  if (y < hit.y || y > hit.y + hit.height) return null;
  return hit;
}
