// 픽커 컨텍스트별 카테고리 스펙 + 옵션→카테고리 분류 함수.
//
// 정책:
//   - insert 컨텍스트: 4개 카테고리(note/dotted/rest/dotted-rest, multi 모드).
//     기본 활성은 'note'만 — 초보자는 음표만 보고, 점음표/쉼표가 필요해질 때 토글한다.
//   - replace 컨텍스트: 위 4개 + 'pitch'(음정 ▲▼ + 화음 head 추가/제거). 기본 활성 'note'+'pitch' —
//     음표 클릭 시 가장 흔한 액션이 음정 미세 조정과 화음 쌓기이므로 즉시 노출.
//   - timeSig 컨텍스트: 2개 카테고리(simple/compound, single 모드).
//     기본 활성은 'simple'.
//
// 카테고리 표지는 한국어 라벨이다. 본 앱은 교육용이라 음악 기호를 모르는 사용자가
// "이 묶음이 무엇인지" 텍스트로 인지해야 한다. 라벨 변경 시 이 파일만 손보면 됨.
//
// 카테고리 분류는 picker-options의 PickerOption을 입력으로 받아 단일 함수(`categoryOf`)로
// 처리한다. 카테고리 추가/변경 시 이 파일과 라벨만 손보면 됨.

import { isCompoundMeter, SMUFL } from '@oon/core';
import type { PickerOption } from './picker-options.js';

export type PickerContext = 'insert' | 'replace' | 'timeSig';

export type ToggleMode = 'multi' | 'single';

export interface PickerCategory {
  id: string;
  /** 토글 표지 한국어 라벨(예: '음표', '점쉼표', '기본', '복합'). */
  label: string;
}

export interface PickerCategorySpec {
  mode: ToggleMode;
  categories: readonly PickerCategory[];
  /** 픽커가 처음 열릴 때 활성된 카테고리 id 목록. multi면 여러 개, single이면 한 개. */
  defaultActive: readonly string[];
}

const CAT_NOTE: PickerCategory = { id: 'note', label: '음표' };
const CAT_DOTTED: PickerCategory = { id: 'dotted', label: '점음표' };
const CAT_REST: PickerCategory = { id: 'rest', label: '쉼표' };
const CAT_DOTTED_REST: PickerCategory = { id: 'dotted-rest', label: '점쉼표' };
// replace 전용 — 음정 이동(▲▼)과 화음 head 추가/제거 옵션을 묶는 카테고리.
const CAT_PITCH: PickerCategory = { id: 'pitch', label: '음정' };

const INSERT_CATEGORIES: readonly PickerCategory[] = [
  CAT_NOTE,
  CAT_DOTTED,
  CAT_REST,
  CAT_DOTTED_REST,
];
const REPLACE_CATEGORIES: readonly PickerCategory[] = [
  CAT_NOTE,
  CAT_DOTTED,
  CAT_REST,
  CAT_DOTTED_REST,
  CAT_PITCH,
];

// 단순박/복합박 — 음악 용어 그대로지만, 사용자가 더 직관적으로 인지하도록 '기본'/'복합'.
const CAT_SIMPLE: PickerCategory = { id: 'simple', label: '기본' };
const CAT_COMPOUND: PickerCategory = { id: 'compound', label: '복합' };

// 컨텍스트별 스펙 — 단일 진실 원천. 새 컨텍스트 도입 시 한 곳만 추가.
export const PICKER_CATEGORY_SPECS: Readonly<Record<PickerContext, PickerCategorySpec>> = {
  insert: {
    mode: 'multi',
    categories: INSERT_CATEGORIES,
    defaultActive: ['note'],
  },
  replace: {
    mode: 'multi',
    categories: REPLACE_CATEGORIES,
    // 음표 클릭 직후 가장 흔한 액션이 음정 미세 조정/화음 쌓기 → 'pitch'도 기본 활성.
    defaultActive: ['note', 'pitch'],
  },
  timeSig: {
    mode: 'single',
    categories: [CAT_SIMPLE, CAT_COMPOUND],
    defaultActive: ['simple'],
  },
};

/**
 * 옵션이 어느 카테고리에 속하는지 분류.
 * - insertNote/replaceNote → 'dotted' if dotted else 'note'
 * - insertRest/replaceWithRest → 'dotted-rest' if dotted else 'rest'
 * - addChordPitch/removeChordHead → 'pitch' (음정/화음 조작; ▲▼는 별도 컬럼이라 그리드 옵션 아님)
 * - setTimeSignature → 'compound' if isCompoundMeter else 'simple'
 */
export function categoryOf(option: PickerOption): string {
  switch (option.kind) {
    case 'insertNote':
    case 'replaceNote':
      return option.dotted ? 'dotted' : 'note';
    case 'insertRest':
    case 'replaceWithRest':
      return option.dotted ? 'dotted-rest' : 'rest';
    case 'addChordPitch':
    case 'removeChordHead':
      return 'pitch';
    case 'setTimeSignature':
      return isCompoundMeter(option.timeSignature) ? 'compound' : 'simple';
  }
}

/** 활성 카테고리 집합으로 옵션 목록을 필터. 활성된 카테고리에 속한 옵션만 통과. */
export function filterByCategories(
  options: readonly PickerOption[],
  active: ReadonlySet<string>,
): PickerOption[] {
  return options.filter((o) => active.has(categoryOf(o)));
}

/** 컨텍스트의 기본 활성 집합을 새 Set으로 반환. */
export function defaultActiveFor(ctx: PickerContext): Set<string> {
  return new Set(PICKER_CATEGORY_SPECS[ctx].defaultActive);
}

/** 셀 콘텐츠에서 점음표 표지에 사용하는 augmentationDot 글리프(상수 노출용). */
export const AUGMENTATION_DOT_GLYPH: string = SMUFL.augmentationDot;
