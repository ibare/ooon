import type { ScoreNode } from '@oon/core';
import {
  CanvasProjector,
  loadBravura,
  renderScore,
} from '@oon/projector-web';
import { calculateScoreLayout, type ScoreLayout } from '@oon/score-engraving';
import { EditableScore, type ScoreCommand } from '@oon/editor-core';
import {
  calculateBeatSlots,
  findSlotAt,
  type BeatSlotRect,
} from './geometry/beat-overlay.js';
import {
  calculatePluckZones,
  findZoneAt,
  type PluckZoneRect,
} from './geometry/pluck-zone.js';
import { pitchAt } from './geometry/inverse-pitch.js';
import { buildPickerOptions, type PickerOption } from './geometry/picker-options.js';
import { drawBeatOverlay } from './render/draw-overlay.js';
import { drawPluckZones } from './render/draw-pluck.js';
import { drawVibrationLine, isVibrationFinished } from './render/draw-vibration.js';
import { drawPicker, layoutPicker } from './render/draw-picker.js';
import { Metronome } from './audio/metronome.js';
import { PreviewEngine } from './audio/preview-engine.js';
import {
  initialState,
  type EditorState,
  type MetronomeBlinkState,
  type VibrationState,
} from './interactions/state.js';
import {
  BEAT_OVERLAY_BLINK_MS,
  UI_CANVAS_PAD_BOTTOM,
  UI_CANVAS_PAD_TOP,
} from './constants.js';

export interface MountScoreEditorOptions {
  /** 초기 DSL. score 블록이 아니면 throw. */
  source?: string;
  /** 또는 미리 만든 ScoreNode. */
  node?: ScoreNode;
  /** 컨텐츠 폭(미지정 시 컨테이너 폭 자동). */
  width?: number;
  /** Bravura 폰트 URL(미지정 시 'fonts/Bravura.woff2'). */
  bravuraUrl?: string;
  /** 노트 미리듣기용 smplr 샘플 베이스 URL. */
  samplesBaseUrl?: string;
  /** 변경 알림. node와 dsl이 함께 전달된다. */
  onChange?(event: { dsl: string; node: ScoreNode; command: ScoreCommand }): void;
  onError?(err: unknown): void;
}

export interface ScoreEditorHandle {
  /** 외부에서 DSL 교체. picker가 열려 있으면 닫힌다. */
  setSource(source: string | ScoreNode): void;
  /** "박자 느끼기" 트리거 — 첫 빈 마디에 대해 메트로놈 한 마디 + 슬롯 깜빡임. */
  feelBeat(): void;
  getDsl(): string;
  dispose(): void;
}

const MIN_AUTO_WIDTH = 320;
const RESIZE_DEBOUNCE_MS = 80;

export function mountScoreEditor(host: HTMLElement, opts: MountScoreEditorOptions): ScoreEditorHandle {
  if (opts.source === undefined && opts.node === undefined) {
    throw new Error('@oon/editor-web mountScoreEditor: opts.source or opts.node required');
  }
  const editable = opts.node
    ? new EditableScore({ node: opts.node })
    : new EditableScore({ source: opts.source! });

  const root = document.createElement('div');
  root.className = 'oon-editor';
  // 듀얼 캔버스: score-canvas는 DOM 흐름 안, ui-canvas는 그 위로 absolute 오버레이.
  // ui-canvas는 위·아래 패드만큼 score-canvas보다 키워 픽커 등 UI가 score 영역 밖으로
  // 펼쳐질 공간을 확보한다. 기본 pointer-events:none이라 평소엔 이벤트가 그대로
  // score-canvas로 통과하고, 픽커가 열렸을 때만 'auto'로 토글하여 모달처럼 동작한다.
  const canvasWrap = document.createElement('div');
  canvasWrap.className = 'oon-editor__canvas';
  canvasWrap.style.position = 'relative';
  const scoreCanvas = document.createElement('canvas');
  const uiCanvas = document.createElement('canvas');
  uiCanvas.style.position = 'absolute';
  uiCanvas.style.left = '0';
  uiCanvas.style.top = `${-UI_CANVAS_PAD_TOP}px`;
  uiCanvas.style.pointerEvents = 'none';
  canvasWrap.appendChild(scoreCanvas);
  canvasWrap.appendChild(uiCanvas);
  const errorEl = document.createElement('div');
  errorEl.style.color = '#b91c1c';
  errorEl.style.fontSize = '0.85em';
  errorEl.style.marginTop = '0.4em';
  root.appendChild(canvasWrap);
  root.appendChild(errorEl);
  host.appendChild(root);

  const scoreProjector = new CanvasProjector(scoreCanvas);
  const uiProjector = new CanvasProjector(uiCanvas);
  const metronome = new Metronome();
  const preview = new PreviewEngine(
    opts.samplesBaseUrl ? { pianoBaseUrl: opts.samplesBaseUrl } : {},
    opts.onError,
  );

  let state: EditorState = initialState();
  let containerWidth: number | null = null;
  let layout: ScoreLayout | null = null;
  let beatSlots: readonly BeatSlotRect[] = [];
  let pluckZones: readonly PluckZoneRect[] = [];
  let resizeTimer: ReturnType<typeof setTimeout> | null = null;
  let rafId: number | null = null;
  let bravuraLoaded = false;
  let bravuraPromise: Promise<void> | null = null;
  const bravuraUrl = opts.bravuraUrl ?? 'fonts/Bravura.woff2';

  const fontPromise = (): Promise<void> => {
    if (bravuraLoaded) return Promise.resolve();
    if (bravuraPromise) return bravuraPromise;
    bravuraPromise = loadBravura({ url: bravuraUrl })
      .then(() => {
        bravuraLoaded = true;
      })
      .catch(() => {
        bravuraLoaded = true;
      });
    return bravuraPromise;
  };

  const layoutBudget = (): number | null => opts.width ?? containerWidth;

  // 두 projector를 같은 contentScale로 동기 리사이즈한다. score 캔버스는 layout 크기 그대로,
  // ui 캔버스는 위·아래 패드만큼 더 큰 콘텐츠 영역을 갖는다(좌표계는 paintUI에서 정렬).
  const applyResize = (): void => {
    if (!layout || containerWidth === null) return;
    const contentScale = Math.min(1, containerWidth / layout.width);
    scoreProjector.resize(layout.width, layout.height, { contentScale });
    uiProjector.resize(
      layout.width,
      layout.height + UI_CANVAS_PAD_TOP + UI_CANVAS_PAD_BOTTOM,
      { contentScale },
    );
  };

  const rebuild = (): void => {
    const budget = layoutBudget();
    if (budget === null || budget <= 0 || containerWidth === null) return;
    layout = calculateScoreLayout(editable.getNode(), { width: budget });
    beatSlots = calculateBeatSlots(layout, editable.getNode());
    pluckZones = calculatePluckZones(layout);
    applyResize();
  };

  // score 캔버스: 보표 + 박자 오버레이 + 튕기기 zone + 진동선.
  // ui 캔버스: 픽커만(score 좌표계와 정렬을 위해 translate로 위쪽 패드만큼 보정).
  const paintScore = (): void => {
    if (!layout) return;
    scoreProjector.clear();
    renderScore(scoreProjector, layout);
    drawBeatOverlay(scoreProjector, beatSlots, {
      hovered: state.hoveredSlot,
      blinkSlot: currentBlinkSlot(),
    });
    drawPluckZones(scoreProjector, pluckZones, {
      hovered: state.hoveredZone,
      hoverSnappedY: state.pluckSnappedY,
    });
    if (state.vibration) {
      const elapsed = (performance.now() - state.vibration.startTime) / 1000;
      drawVibrationLine(scoreProjector, {
        elapsedSec: elapsed,
        centerY: state.vibration.centerY,
        x1: state.vibration.x1,
        x2: state.vibration.x2,
      });
    }
  };

  const paintUI = (): void => {
    uiProjector.clear();
    if (!state.picker) return;
    uiProjector.save();
    uiProjector.translate(0, UI_CANVAS_PAD_TOP);
    drawPicker(uiProjector, state.picker.layout, { hoveredIndex: state.picker.hoveredIndex });
    uiProjector.restore();
  };

  const paint = (): void => {
    paintScore();
    paintUI();
  };

  const currentBlinkSlot = (): BeatSlotRect | null => {
    const blink = state.blink;
    if (!blink) return null;
    const elapsed = performance.now() - blink.startTime;
    const totalBeats = editable.getNode().timeSignature.beats;
    if (elapsed > BEAT_OVERLAY_BLINK_MS * totalBeats * 2) return null;
    return (
      beatSlots.find(
        (s) => s.barIndex === blink.barIndex && s.beatIndex === blink.activeBeat,
      ) ?? null
    );
  };

  const tickRaf = (): void => {
    if (state.vibration && isVibrationFinished((performance.now() - state.vibration.startTime) / 1000)) {
      state = { ...state, vibration: null };
    }
    paint();
    if (state.vibration || state.blink) {
      rafId = requestAnimationFrame(tickRaf);
    } else {
      rafId = null;
    }
  };

  const ensureRaf = (): void => {
    if (rafId === null) rafId = requestAnimationFrame(tickRaf);
  };

  // 양 캔버스의 이벤트는 모두 score 좌표계로 환산해 처리한다.
  // scoreProjector.clientToContentPoint는 client 좌표를 score 캔버스 콘텐츠 좌표로 바꾸므로
  // ui 캔버스에서 발생한 이벤트도 (위쪽 패드 영역의 클릭은 음수 y로) 일관되게 표현된다.
  const onPointerMove = (ev: PointerEvent): void => {
    const p = scoreProjector.clientToContentPoint(ev.clientX, ev.clientY);
    if (state.picker) {
      const rows = state.picker.layout.rows;
      let hoveredIndex: number | null = null;
      for (const r of rows) {
        if (p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height) {
          hoveredIndex = r.index;
          break;
        }
      }
      state = { ...state, picker: { ...state.picker, hoveredIndex } };
      paint();
      return;
    }
    const slot = findSlotAt(beatSlots, p.x, p.y);
    const zone = findZoneAt(pluckZones, p.x, p.y);
    let snapped: number | null = null;
    let pitch: string | null = null;
    if (zone) {
      const z = zone;
      const r = pitchAt({
        y: p.y,
        staff: { top: z.staffTop, bottom: z.staffBottom, lineGap: z.staffLineGap, y: 0, lines: [] },
      });
      snapped = r.snappedY;
      pitch = r.pitch;
    }
    state = { ...state, hoveredSlot: slot, hoveredZone: zone, pluckSnappedY: snapped, pluckPitch: pitch };
    scoreCanvas.style.cursor = slot || zone ? 'pointer' : 'default';
    paint();
  };

  const onPointerDown = (ev: PointerEvent): void => {
    const p = scoreProjector.clientToContentPoint(ev.clientX, ev.clientY);
    if (state.picker) {
      const row = state.picker.layout.rows.find(
        (r) => p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height,
      );
      if (row) {
        commitPickerChoice(row.option);
      } else {
        closePicker();
      }
      return;
    }
    const slot = findSlotAt(beatSlots, p.x, p.y);
    if (slot) {
      openPicker(slot, p.y);
      return;
    }
    const zone = findZoneAt(pluckZones, p.x, p.y);
    if (zone) {
      pluckAt(zone, p.y);
    }
  };

  const openPicker = (slot: BeatSlotRect, y: number): void => {
    if (!layout) return;
    const node = editable.getNode();
    const beatsPerBar = node.timeSignature.beats;
    const usedBeats = (node.bars[slot.barIndex]?.notes ?? []).reduce((s, n) => s + n.beats, 0);
    const remain = Math.max(0, beatsPerBar - usedBeats);
    const options = buildPickerOptions({ remainBeats: remain, beatsPerBar });
    if (options.length === 0) return;
    const system = layout.systems.find((s) => s.index === slot.systemIndex);
    const staff = system?.staff;
    if (!staff) return;
    const pickResult = pitchAt({ y, staff });
    // ui 캔버스가 score 영역 위·아래 패드만큼 더 크므로 픽커는 위로(음수 y)도, 아래로도 펼쳐질
    // 수 있다. score 좌표계 기준 [-PAD_TOP, layout.height + PAD_BOTTOM] 범위로 클램프한다.
    const pickerLayout = layoutPicker({
      anchorX: slot.x + slot.width + 6,
      anchorY: slot.y,
      options,
      contentWidth: layout.width,
      contentMinY: -UI_CANVAS_PAD_TOP,
      contentHeight: layout.height + UI_CANVAS_PAD_BOTTOM,
    });
    state = {
      ...state,
      mode: 'picker',
      picker: {
        layout: pickerLayout,
        barIndex: slot.barIndex,
        beatIndex: slot.beatIndex,
        pitch: pickResult.pitch,
        hoveredIndex: null,
      },
    };
    uiCanvas.style.pointerEvents = 'auto';
    paint();
  };

  const closePicker = (): void => {
    state = { ...state, picker: null, mode: 'idle' };
    uiCanvas.style.pointerEvents = 'none';
    paint();
  };

  const commitPickerChoice = (option: PickerOption): void => {
    if (!state.picker) return;
    const { barIndex, pitch } = state.picker;
    switch (option.kind) {
      case 'insertNote': {
        try {
          editable.dispatch({ type: 'insertNote', barIndex, pitch, duration: option.duration });
        } catch (err) {
          if (opts.onError) opts.onError(err);
          else console.warn('[oon/editor-web] insertNote failed', err);
        }
        void preview.previewNote(pitch, option.duration);
        break;
      }
      case 'insertRest': {
        try {
          editable.dispatch({ type: 'insertRest', barIndex, duration: option.duration });
        } catch (err) {
          if (opts.onError) opts.onError(err);
          else console.warn('[oon/editor-web] insertRest failed', err);
        }
        // 쉼표는 무음 — preview 없음.
        break;
      }
      default: {
        // 향후 kind 추가 시 누락된 case를 컴파일 타임에 잡는다.
        const _exhaustive: never = option;
        void _exhaustive;
      }
    }
    state = { ...state, picker: null, mode: 'idle' };
    uiCanvas.style.pointerEvents = 'none';
    rebuild();
    paint();
  };

  const pluckAt = (zone: PluckZoneRect, y: number): void => {
    if (!layout) return;
    const system = layout.systems.find((s) => s.index === zone.systemIndex);
    if (!system) return;
    const lastBar = system.bars[system.bars.length - 1];
    if (!lastBar) return;
    const node = editable.getNode();
    const beatsPerBar = node.timeSignature.beats;
    const usedBeats = (node.bars[zone.lastBarIndex]?.notes ?? []).reduce((s, n) => s + n.beats, 0);
    const remain = Math.max(0, beatsPerBar - usedBeats);
    if (remain <= 0) return;

    const pickResult = pitchAt({ y, staff: system.staff });
    const duration = pickFitDuration(remain);
    if (!duration) return;

    const vibration: VibrationState = {
      startTime: performance.now(),
      centerY: pickResult.snappedY,
      x1: lastBar.x,
      x2: zone.x + zone.width,
    };
    state = { ...state, mode: 'plucking', vibration };
    try {
      editable.dispatch({ type: 'insertNote', barIndex: zone.lastBarIndex, pitch: pickResult.pitch, duration });
    } catch (err) {
      if (opts.onError) opts.onError(err);
      else console.warn('[oon/editor-web] pluck insertNote failed', err);
    }
    void preview.previewNote(pickResult.pitch, duration);
    rebuild();
    ensureRaf();
    paint();
  };

  const pickFitDuration = (remain: number): 'q' | 'h' | 'w' | 'e' | 's' | null => {
    if (remain >= 1) return 'q';
    if (remain >= 0.5) return 'e';
    if (remain >= 0.25) return 's';
    return null;
  };

  // EditableScore의 onChange를 외부로 중계.
  const unsubscribe = editable.subscribe((ev) => {
    if (opts.onChange) opts.onChange(ev);
  });

  const ro = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (!entry) return;
    const w = Math.max(MIN_AUTO_WIDTH, Math.floor(entry.contentRect.width));
    if (resizeTimer !== null) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (containerWidth === w) return;
      containerWidth = w;
      rebuild();
      paint();
    }, RESIZE_DEBOUNCE_MS);
  });
  ro.observe(host);
  const initialRect = host.getBoundingClientRect();
  if (initialRect.width > 0) {
    containerWidth = Math.max(MIN_AUTO_WIDTH, Math.floor(initialRect.width));
  }

  // 양 캔버스에 모두 부착. ui 캔버스는 평소 pointer-events:none이라 이벤트가 score 캔버스로
  // 통과하고, 픽커가 열린 동안에만 pointer-events:auto로 토글되어 ui 캔버스가 이벤트를 받는다.
  scoreCanvas.addEventListener('pointermove', onPointerMove);
  scoreCanvas.addEventListener('pointerdown', onPointerDown);
  uiCanvas.addEventListener('pointermove', onPointerMove);
  uiCanvas.addEventListener('pointerdown', onPointerDown);

  void fontPromise().then(() => {
    rebuild();
    paint();
  });

  return {
    setSource(source) {
      if (typeof source === 'string') {
        try {
          const newScore = new EditableScore({ source });
          // EditableScore는 immutable 교체 — 기존 listener를 유지하려면 dispatch가 필요하지만
          // 외부 setSource는 보통 풀 리셋 의미. 현재 인스턴스에 노드만 갈아끼우는 건 API 미지원이므로
          // 임시 방편으로 setTimeSignature로 비우고 노트를 차례로 dispatch하는 구조가 필요하다.
          // 현재 단계에선 단순 재마운트가 더 안전 — 외부 호출자가 dispose 후 재마운트하도록 안내한다.
          throw new Error('setSource는 현재 미구현입니다 — dispose 후 재마운트 권장');
        } catch (err) {
          if (opts.onError) opts.onError(err);
          else throw err;
        }
      } else {
        throw new Error('setSource(node)는 현재 미구현입니다 — dispose 후 재마운트 권장');
      }
    },
    feelBeat() {
      const node = editable.getNode();
      const firstEmptyBarIdx = node.bars.findIndex((b) => b.notes.length === 0);
      const barIndex = firstEmptyBarIdx === -1 ? 0 : firstEmptyBarIdx;
      const beats = node.timeSignature.beats;
      const blink: MetronomeBlinkState = {
        activeBeat: 0,
        startTime: performance.now(),
        barIndex,
      };
      state = { ...state, blink };
      ensureRaf();
      metronome.scheduleBar(node.bpm, beats, (beatIdx) => {
        state = { ...state, blink: { activeBeat: beatIdx, startTime: performance.now(), barIndex } };
        ensureRaf();
        paint();
      });
      // 마지막 깜빡임이 끝나면 blink 해제
      const totalMs = (60 / Math.max(1, node.bpm)) * 1000 * beats + BEAT_OVERLAY_BLINK_MS;
      setTimeout(() => {
        state = { ...state, blink: null };
        paint();
      }, totalMs);
    },
    getDsl() {
      return editable.getDsl();
    },
    dispose() {
      ro.disconnect();
      if (resizeTimer !== null) clearTimeout(resizeTimer);
      if (rafId !== null) cancelAnimationFrame(rafId);
      scoreCanvas.removeEventListener('pointermove', onPointerMove);
      scoreCanvas.removeEventListener('pointerdown', onPointerDown);
      uiCanvas.removeEventListener('pointermove', onPointerMove);
      uiCanvas.removeEventListener('pointerdown', onPointerDown);
      metronome.dispose();
      preview.dispose();
      unsubscribe();
      if (host.contains(root)) host.removeChild(root);
    },
  };
}
