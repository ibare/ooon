import { describe, expect, it } from 'vitest';
import { applyToggle, parseToggleToken } from './primitives/toggle-group.js';

describe('applyToggle', () => {
  it('multi: 항목이 없으면 추가', () => {
    const next = applyToggle(new Set(['a']), 'b', 'multi');
    expect([...next].sort()).toEqual(['a', 'b']);
  });

  it('multi: 항목이 있으면 제거', () => {
    const next = applyToggle(new Set(['a', 'b']), 'b', 'multi');
    expect([...next]).toEqual(['a']);
  });

  it('multi: 비어 있는 set에서 추가', () => {
    const next = applyToggle(new Set(), 'a', 'multi');
    expect([...next]).toEqual(['a']);
  });

  it('single: 다른 항목 클릭 시 기존을 대체', () => {
    const next = applyToggle(new Set(['a']), 'b', 'single');
    expect([...next]).toEqual(['b']);
  });

  it('single: 마지막 활성 항목은 다시 클릭해도 유지(라디오 동작 — 빈 상태 방지)', () => {
    const next = applyToggle(new Set(['a']), 'a', 'single');
    expect([...next]).toEqual(['a']);
  });
});

describe('parseToggleToken', () => {
  it('prefix 매칭 시 id 반환', () => {
    expect(parseToggleToken('picker:toggle:dotted', 'picker:toggle')).toBe('dotted');
  });
  it('prefix 불일치 시 null', () => {
    expect(parseToggleToken('picker:cell:0', 'picker:toggle')).toBeNull();
  });
  it('정확히 prefix만 있으면 빈 문자열(파서는 형식만 분리)', () => {
    expect(parseToggleToken('picker:toggle:', 'picker:toggle')).toBe('');
  });
});
