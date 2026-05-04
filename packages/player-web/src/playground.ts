import { parseBlock, type ScoreNode } from '@oon/core';
import { mountKeyboardView, type KeyboardViewHandle } from '@oon/projector-web';
import { mountScoreEditor, type ScoreEditorHandle } from '@oon/editor-web';
import { getScoreActiveNotes } from '@oon/score-engraving';
import {
  createControlsBar,
  DEFAULT_LABELS_EN,
  type ControlsBarHandle,
  type PlayerLabels,
} from './controls-bar.js';
import { getAudioEngine, type EngineFactoryOptions } from './audio/engine-factory.js';
import { playSource, type PlaybackHandle } from './audio/playback.js';

export interface PlaygroundOptions extends EngineFactoryOptions {
  /** 초기 DSL. score 블록이어야 한다(편집기 컨텍스트). */
  source: string;
  /** 편집기에서 DSL이 갱신될 때 통지. */
  onChange?(dsl: string): void;
  /** Bravura 폰트 URL. 미지정 시 'fonts/Bravura.woff2'. */
  bravuraUrl?: string;
  /** 컨트롤 라벨. 미지정 시 영문 기본. */
  labels?: PlayerLabels;
  onPlayingChange?(playing: boolean): void;
  /** 재생 오류 통지. 미주입 시 console.warn. */
  onError?(err: unknown): void;
}

export interface PlaygroundHandle {
  play(): Promise<void>;
  stop(): void;
  /** 외부에서 DSL 교체. 편집기/키보드 둘 다 갱신. */
  setSource(source: string | ScoreNode): void;
  /** 현재 DSL 조회. */
  getDsl(): string;
  dispose(): void;
}

type State = 'idle' | 'loading' | 'playing';

/**
 * "편집하며 듣기" 사용 사례의 조립 facade.
 *
 * 호스트 책임은 DSL(`source`) 공급과 마운트 영역 확보뿐. 부품 조립 순서(상단→하단:
 * 컨트롤바 → 키보드 → 편집기)와 형태 컨벤션은 모두 이 facade가 강제한다. score 단일 블록을
 * 편집하는 컨텍스트라 트랙 chip은 숨기고, 키보드는 음역 jitter를 피하기 위해 `full88` 고정.
 *
 * 부품:
 * - controls-bar (재생 버튼)
 * - mountKeyboardView (range='full88')
 * - mountScoreEditor (편집기)
 *
 * 재생: 컨트롤바 ▶ → audio engine init → 현재 DSL을 playSource로 재생. 동시에 RAF tick으로
 * 현재 beat을 계산해 `getScoreActiveNotes`로 활성 음을 뽑고 `keyboard.setActive`로 누름 표시한다.
 */
export function mountPlayground(host: HTMLElement, opts: PlaygroundOptions): PlaygroundHandle {
  const labels = opts.labels ?? DEFAULT_LABELS_EN;

  const root = document.createElement('div');
  root.className = 'oon-playground';
  host.appendChild(root);

  let state: State = 'idle';
  let audioHandle: PlaybackHandle | null = null;
  let stopTimer: ReturnType<typeof setTimeout> | null = null;
  let rafId: number | null = null;
  let currentDsl = opts.source;

  const stopRaf = (): void => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  const stopAudio = (): void => {
    audioHandle?.stop();
    audioHandle = null;
    if (stopTimer !== null) {
      clearTimeout(stopTimer);
      stopTimer = null;
    }
  };

  // 재생 시작 시 score를 한 번 파싱해 RAF tick에서 매 프레임 active notes 조회.
  // beat = elapsedSec * (bpm/60). beat가 곡 끝을 넘으면 setActive(null)로 정리.
  const startKeyboardRaf = (scoreNode: ScoreNode): void => {
    const bpm = scoreNode.bpm;
    const beatsPerBar = scoreNode.timeSignature.beats;
    const totalBeats = scoreNode.bars.length * beatsPerBar;
    const startMs = performance.now();
    const tick = (): void => {
      const elapsedSec = (performance.now() - startMs) / 1000;
      const beat = elapsedSec * (bpm / 60);
      if (beat >= totalBeats) {
        keyboard.setActive(null);
        rafId = null;
        return;
      }
      const active = getScoreActiveNotes(scoreNode, beat, beatsPerBar);
      if (active.melodyMidi === null && active.chordMidis.length === 0) {
        keyboard.setActive(null);
      } else {
        keyboard.setActive({
          melodyMidi: active.melodyMidi,
          chordMidis: active.chordMidis,
          rootMidi: active.rootMidi,
        });
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  };

  const handlePlayToggle = (): void => {
    if (state === 'playing') {
      stopAudio();
      setState('idle');
      return;
    }
    if (state === 'loading') return;
    void play();
  };

  // controls-bar는 자체적으로 우측 정렬 + 100% 폭 + 아래 여백을 캡슐화한다.
  const controls: ControlsBarHandle = createControlsBar(root, {
    labels,
    onPlayToggle: handlePlayToggle,
    onMuteToggle: () => {
      // score 단일 블록은 트랙 분리가 명확하지 않으므로 mute 토글은 의미 없음. chip 자체가 숨겨진다.
    },
  });
  controls.setShowChips(false);

  // 키보드 영역(중간) — score 음역 jitter를 막기 위해 'full88' 고정.
  const keyboardWrap = document.createElement('div');
  keyboardWrap.className = 'oon-playground__keyboard';
  keyboardWrap.style.marginBottom = '0.75em';
  root.appendChild(keyboardWrap);
  const keyboard: KeyboardViewHandle = mountKeyboardView(keyboardWrap, {
    range: 'full88',
    showLabels: true,
  });

  // 편집기 영역(하단)
  const editorWrap = document.createElement('div');
  editorWrap.className = 'oon-playground__editor';
  root.appendChild(editorWrap);
  const editor: ScoreEditorHandle = mountScoreEditor(editorWrap, {
    source: opts.source,
    ...(opts.bravuraUrl !== undefined ? { bravuraUrl: opts.bravuraUrl } : {}),
    ...(opts.samplesBaseUrl !== undefined ? { samplesBaseUrl: opts.samplesBaseUrl } : {}),
    onChange: (ev) => {
      currentDsl = ev.dsl;
      opts.onChange?.(ev.dsl);
    },
  });

  const setState = (next: State): void => {
    state = next;
    controls.setState(state);
    if (state !== 'playing') {
      stopRaf();
      keyboard.setActive(null);
    }
    opts.onPlayingChange?.(state === 'playing');
  };

  const play = async (): Promise<void> => {
    setState('loading');
    try {
      const engine = await getAudioEngine({
        ...(opts.samplesBaseUrl !== undefined ? { samplesBaseUrl: opts.samplesBaseUrl } : {}),
      });
      const handle = playSource(engine, currentDsl, {});
      if (handle.durationSec <= 0) {
        setState('idle');
        return;
      }
      audioHandle = handle;
      setState('playing');
      // setState('playing')가 RAF/active를 정리하지 않으므로 여기서 RAF를 시작.
      // playSource가 실패하지 않은 시점이면 score 파싱도 성공한다고 봐도 되지만,
      // 키보드 강조용이라 실패해도 audio는 계속 재생되도록 분리해서 처리.
      const scoreNode = parseScoreOrNull(currentDsl);
      if (scoreNode) startKeyboardRaf(scoreNode);
      stopTimer = setTimeout(() => {
        stopAudio();
        setState('idle');
      }, handle.durationSec * 1000 + 500);
    } catch (err) {
      if (opts.onError) opts.onError(err);
      else console.warn('[oon/player-web mountPlayground] playback failed', err);
      setState('idle');
    }
  };

  return {
    async play() {
      if (state !== 'idle') return;
      await play();
    },
    stop() {
      stopAudio();
      if (state !== 'idle') setState('idle');
    },
    setSource(source) {
      stopAudio();
      if (state !== 'idle') setState('idle');
      editor.setSource(source);
      currentDsl = typeof source === 'string' ? source : editor.getDsl();
    },
    getDsl() {
      return currentDsl;
    },
    dispose() {
      stopAudio();
      stopRaf();
      controls.dispose();
      keyboard.dispose();
      editor.dispose();
      if (host.contains(root)) host.removeChild(root);
    },
  };
}

function parseScoreOrNull(dsl: string): ScoreNode | null {
  try {
    const node = parseBlock(dsl);
    return node.type === 'score' ? node : null;
  } catch {
    return null;
  }
}
