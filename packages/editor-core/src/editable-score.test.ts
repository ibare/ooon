import { describe, expect, it, vi } from 'vitest';
import { EditableScore } from '@ooon/editor-core';

describe('EditableScore (public API integration)', () => {
  it('initializes from DSL source and exposes node + dsl', () => {
    const ed = new EditableScore({ source: 'score 4/4' });
    expect(ed.getNode().bars[0]?.notes.length).toBe(0);
    expect(ed.getDsl()).toBe('score 4/4');
  });

  it('throws when source is not a score block', () => {
    expect(() => new EditableScore({ source: 'drum 4/4 res:16\n  HH x---x---x---x---' })).toThrow(
      /expected score/,
    );
  });

  it('dispatch(insertNote) emits onChange with new node and serialized DSL', () => {
    const ed = new EditableScore({ source: 'score 4/4' });
    const listener = vi.fn();
    ed.subscribe(listener);

    ed.dispatch({ type: 'insertNote', barIndex: 0, pitch: 'C4', duration: 'q' });

    expect(listener).toHaveBeenCalledTimes(1);
    const event = listener.mock.calls[0]?.[0];
    expect(event.node.bars[0]?.notes.length).toBe(1);
    expect(event.dsl).toBe('score 4/4\n  C4/q');
    expect(event.command).toEqual({
      type: 'insertNote',
      barIndex: 0,
      pitch: 'C4',
      duration: 'q',
    });
  });

  it('subscribe returns an unsubscribe that stops further notifications', () => {
    const ed = new EditableScore({ source: 'score 4/4' });
    const listener = vi.fn();
    const off = ed.subscribe(listener);
    ed.dispatch({ type: 'insertNote', barIndex: 0, pitch: 'C4', duration: 'q' });
    off();
    ed.dispatch({ type: 'insertNote', barIndex: 0, pitch: 'D4', duration: 'q' });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('multiple inserts accumulate and DSL reflects insertion order', () => {
    const ed = new EditableScore({ source: 'score 4/4' });
    ed.dispatch({ type: 'insertNote', barIndex: 0, pitch: 'C4', duration: 'q' });
    ed.dispatch({ type: 'insertNote', barIndex: 0, pitch: 'E4', duration: 'q' });
    ed.dispatch({ type: 'insertNote', barIndex: 0, pitch: 'G4', duration: 'h' });
    expect(ed.getDsl()).toBe('score 4/4\n  C4/q E4/q G4/h');
  });
});
