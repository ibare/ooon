import { describe, expect, it } from 'vitest';
import {
  PICKER_CATEGORY_SPECS,
  categoryOf,
  defaultActiveFor,
  filterByCategories,
} from './picker-categories.js';
import type { PickerOption } from './picker-options.js';

function note(dotted: boolean): PickerOption {
  return {
    kind: 'insertNote',
    duration: dotted ? 'q.' : 'q',
    beats: dotted ? 1.5 : 1,
    glyph: 'noteQuarterUp',
    dotted,
  };
}

function rest(dotted: boolean): PickerOption {
  return {
    kind: 'insertRest',
    duration: dotted ? 'q.' : 'q',
    beats: dotted ? 1.5 : 1,
    glyph: 'restQuarter',
    dotted,
  };
}

function ts(beats: number, beatValue: number): PickerOption {
  return {
    kind: 'setTimeSignature',
    timeSignature: { beats, beatValue },
    topGlyph: String(beats),
    bottomGlyph: String(beatValue),
    label: `${beats}/${beatValue}`,
  };
}

describe('categoryOf', () => {
  it('점 없는 음표는 note', () => {
    expect(categoryOf(note(false))).toBe('note');
  });
  it('점음표는 dotted', () => {
    expect(categoryOf(note(true))).toBe('dotted');
  });
  it('점 없는 쉼표는 rest', () => {
    expect(categoryOf(rest(false))).toBe('rest');
  });
  it('점쉼표는 dotted-rest', () => {
    expect(categoryOf(rest(true))).toBe('dotted-rest');
  });
  it('단순 박자(4/4)는 simple', () => {
    expect(categoryOf(ts(4, 4))).toBe('simple');
  });
  it('복합 박자(6/8)는 compound', () => {
    expect(categoryOf(ts(6, 8))).toBe('compound');
  });
  it('비대칭 박자(7/8)는 simple로 분류 — 복합이 아니므로', () => {
    expect(categoryOf(ts(7, 8))).toBe('simple');
  });
});

describe('filterByCategories', () => {
  it('활성 카테고리에 속한 옵션만 통과', () => {
    const opts: PickerOption[] = [note(false), note(true), rest(false), rest(true)];
    const filtered = filterByCategories(opts, new Set(['note']));
    expect(filtered.length).toBe(1);
    expect(filtered[0]).toBe(opts[0]);
  });

  it('여러 카테고리 활성 시 모두 통과', () => {
    const opts: PickerOption[] = [note(false), note(true), rest(false), rest(true)];
    const filtered = filterByCategories(opts, new Set(['note', 'rest']));
    expect(filtered.length).toBe(2);
    expect(filtered.map((o) => o.kind)).toEqual(['insertNote', 'insertRest']);
  });

  it('비어 있는 active set은 모두 거름', () => {
    const opts: PickerOption[] = [note(false), rest(false)];
    expect(filterByCategories(opts, new Set()).length).toBe(0);
  });
});

describe('defaultActiveFor', () => {
  it('insert/replace 기본은 note만', () => {
    expect([...defaultActiveFor('insert')]).toEqual(['note']);
    expect([...defaultActiveFor('replace')]).toEqual(['note']);
  });

  it('timeSig 기본은 simple만', () => {
    expect([...defaultActiveFor('timeSig')]).toEqual(['simple']);
  });

  it('반환 set은 새 인스턴스 — 호출 간 독립', () => {
    const a = defaultActiveFor('insert');
    const b = defaultActiveFor('insert');
    expect(a).not.toBe(b);
  });
});

describe('PICKER_CATEGORY_SPECS', () => {
  it('insert/replace는 multi 모드, 카테고리 4종(note/dotted/rest/dotted-rest)', () => {
    for (const ctx of ['insert', 'replace'] as const) {
      const spec = PICKER_CATEGORY_SPECS[ctx];
      expect(spec.mode).toBe('multi');
      expect(spec.categories.map((c) => c.id)).toEqual([
        'note',
        'dotted',
        'rest',
        'dotted-rest',
      ]);
    }
  });

  it('timeSig는 single 모드, 카테고리 2종(simple/compound)', () => {
    const spec = PICKER_CATEGORY_SPECS.timeSig;
    expect(spec.mode).toBe('single');
    expect(spec.categories.map((c) => c.id)).toEqual(['simple', 'compound']);
  });

  it('카테고리 라벨은 한국어(교육용 — 음악 기호 모르는 사용자가 텍스트로 인지)', () => {
    const insertLabels = PICKER_CATEGORY_SPECS.insert.categories.map((c) => c.label);
    expect(insertLabels).toEqual(['음표', '점음표', '쉼표', '점쉼표']);
    const timeSigLabels = PICKER_CATEGORY_SPECS.timeSig.categories.map((c) => c.label);
    expect(timeSigLabels).toEqual(['기본', '복합']);
  });
});
