import type { Projector } from '@oon/shared';
import type { KeyboardLayout } from '@oon/instrument-layouts';

export interface KeyboardHighlightInput {
  /** 활성 melody 노트 MIDI(rest거나 미상이면 null). */
  melodyMidi: number | null;
  /** 활성 chord 보이싱 MIDI 집합. */
  chordMidis: ReadonlySet<number> | readonly number[];
}

export interface KeyboardHighlightOptions {
  originX?: number;
  originY?: number;
  /** chord 매칭 키 색(반투명 권장). */
  chordColor?: string;
  /** 정확한 melody MIDI 매칭 키 색. */
  melodyColor?: string;
}

const DEFAULT_CHORD_COLOR = 'rgba(37, 99, 235, 0.28)';
const DEFAULT_MELODY_COLOR = 'rgba(220, 38, 38, 0.55)';

/**
 * Song 키보드 위에 활성 키 오버레이를 그린다.
 * - chord 보이싱 MIDI와 일치하는 키를 chordColor로 채움
 * - melody MIDI와 정확히 일치하는 키를 melodyColor로 채움(상위 레이어)
 * 키 자체의 strokes/labels는 keyboard-renderer가 그린다.
 */
export function drawKeyboardHighlights(
  projector: Projector,
  layout: KeyboardLayout,
  active: KeyboardHighlightInput,
  opts: KeyboardHighlightOptions = {},
): void {
  const ox = opts.originX ?? 0;
  const oy = opts.originY ?? 0;
  const chordColor = opts.chordColor ?? DEFAULT_CHORD_COLOR;
  const melodyColor = opts.melodyColor ?? DEFAULT_MELODY_COLOR;

  const chordSet =
    active.chordMidis instanceof Set
      ? (active.chordMidis as ReadonlySet<number>)
      : new Set<number>(active.chordMidis as readonly number[]);
  const melodyMidi = active.melodyMidi;

  if (chordSet.size === 0 && melodyMidi === null) return;

  projector.save();
  projector.translate(ox, oy);

  // 1) chord 오버레이 — 흰건반 먼저, 검은건반 나중에 (스택 순서 일관)
  if (chordSet.size > 0) {
    for (const key of layout.keys) {
      if (key.isBlack) continue;
      if (chordSet.has(key.midi)) {
        projector.drawRect(key.rect, chordColor);
      }
    }
    for (const key of layout.keys) {
      if (!key.isBlack) continue;
      if (chordSet.has(key.midi)) {
        projector.drawRect(key.rect, chordColor);
      }
    }
  }

  // 2) melody 오버레이 — 단일 키
  if (melodyMidi !== null) {
    const target = layout.keys.find((k) => k.midi === melodyMidi);
    if (target) {
      projector.drawRect(target.rect, melodyColor);
    }
  }

  projector.restore();
}
