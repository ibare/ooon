import type { BlockNode } from '@ooon/core';
import type { TrackMute } from '@ooon/shared';
import { mountBlockView, type BlockViewHandle } from '@ooon/projector-web';
import {
  createControlsBar,
  DEFAULT_LABELS_EN,
  type ControlsBarHandle,
  type PlayerLabels,
  type TrackKey,
} from './controls-bar.js';
import { getAudioEngine, type EngineFactoryOptions } from './audio/engine-factory.js';
import { playSource, type PlaybackHandle } from './audio/playback.js';

export type { TrackMute, PlayerLabels };

export interface BlockPlayerOptions extends EngineFactoryOptions {
  /** DSL 소스 문자열. node와 둘 중 하나는 필수. */
  source?: string;
  /** 미리 파싱된 노드. source와 둘 중 하나는 필수. */
  node?: BlockNode;
  /** 작성자 의도 콘텐츠 폭. 미지정 시 컨테이너 폭 자동. */
  width?: number;
  showNoteNames?: boolean;
  /** Bravura 폰트 URL. 미지정 시 'fonts/Bravura.woff2' (host base 상대). */
  bravuraUrl?: string;
  /** 컨트롤 라벨. 미지정 시 영문 기본. */
  labels?: PlayerLabels;
  /** true이면 컨트롤 바를 그리지 않는다(헤드리스). */
  hideControls?: boolean;
  /** 초기 mute. */
  mute?: TrackMute;
  onPlayingChange?(playing: boolean): void;
  /** 재생 오류(엔진 init 실패, 샘플 로드 실패 등) 통지. 미주입 시 console.warn으로 fallback. */
  onError?(err: unknown): void;
}

export interface BlockPlayerHandle {
  play(): Promise<void>;
  stop(): void;
  setMute(mute: TrackMute): void;
  setSource(source: string | BlockNode): void;
  dispose(): void;
}

type State = 'idle' | 'loading' | 'playing';

/**
 * 한 블록(score/drum/progression/fretboard/song)의 시각화 + 컨트롤 + 오디오를 묶는 facade.
 * 시각화는 `@ooon/projector-web`의 mountBlockView, 컨트롤은 controls-bar, 오디오는 playSource를
 * 조립해 만든다. Song 재생 중에는 RAF tick으로 현재 beat을 계산해 blockView.setPlayhead로 주입한다.
 */
export function mountBlockPlayer(host: HTMLElement, opts: BlockPlayerOptions): BlockPlayerHandle {
  if (opts.source === undefined && opts.node === undefined) {
    throw new Error('@ooon/player-web: opts.source or opts.node must be provided');
  }
  const labels = opts.labels ?? DEFAULT_LABELS_EN;

  // 호스트는 영역만 확보. 부품(컨트롤바/시각화)은 자체 형태 컨벤션으로 정렬·여백을 책임진다.
  // 컨트롤바를 root에 먼저 부착(상단)한 뒤 body를 부착(하단)하는 순서가 컨벤션이다.
  const root = document.createElement('div');
  root.className = 'ooon-player';
  const body = document.createElement('div');
  body.className = 'ooon-player__body';
  host.appendChild(root);

  let state: State = 'idle';
  let mute: TrackMute = { ...(opts.mute ?? {}) };
  let audioHandle: PlaybackHandle | null = null;
  let stopTimer: ReturnType<typeof setTimeout> | null = null;
  let rafId: number | null = null;
  let playStartMs = 0;
  let lastSource: string | BlockNode = opts.source ?? opts.node!;

  const stopRaf = (): void => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  // Song 재생 중에만 RAF로 현재 beat을 계산해 blockView에 주입한다.
  // BPM/duration은 blockView 내부 layout state에 있어 외부에서 직접 못 보므로,
  // playSource가 돌려준 durationSec과 호출 시 알고 있는 BPM(node에서 추출)을 사용해 beat 환산.
  const startSongPlayheadRaf = (bpm: number, durationBeats: number): void => {
    stopRaf();
    playStartMs = performance.now();
    const tick = (): void => {
      const elapsedSec = (performance.now() - playStartMs) / 1000;
      const beat = Math.min(elapsedSec * (bpm / 60), durationBeats);
      blockView.setPlayhead(beat);
      if (beat >= durationBeats) {
        rafId = null;
        return;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  };

  const setState = (next: State): void => {
    state = next;
    controls?.setState(state);
    if (next !== 'playing') {
      stopRaf();
      blockView.setPlayhead(null);
      opts.onPlayingChange?.(false);
    } else {
      opts.onPlayingChange?.(true);
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

  const onMuteToggle = (key: TrackKey): void => {
    mute = { ...mute, [key]: !mute[key] };
    blockView.setMute(mute);
    audioHandle?.setMute?.(mute);
    controls?.setMute(mute);
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

  const controls: ControlsBarHandle | null = opts.hideControls
    ? null
    : createControlsBar(root, {
        labels,
        onPlayToggle: handlePlayToggle,
        onMuteToggle,
      });
  controls?.setMute(mute);

  // 컨트롤바를 root에 부착한 뒤 body를 부착해 시각 순서(상단 컨트롤 → 하단 시각화)를 만든다.
  root.appendChild(body);
  const blockView: BlockViewHandle = mountBlockView(body, {
    ...(opts.width !== undefined ? { width: opts.width } : {}),
    ...(opts.showNoteNames !== undefined ? { showNoteNames: opts.showNoteNames } : {}),
    ...(opts.bravuraUrl !== undefined ? { bravuraUrl: opts.bravuraUrl } : {}),
  });

  const updateChipVisibility = (): void => {
    if (!controls) return;
    controls.setShowChips(blockView.getKind() === 'song');
  };

  // blockView는 폰트 비동기 로드 후 첫 페인트가 일어나므로, 짧은 폴링 대신 setSource 후
  // microtask에서 한 번, RAF 한 번 후에 chip 표시를 갱신한다(Song 여부는 파싱 결과에 의존).
  const scheduleChipSync = (): void => {
    queueMicrotask(updateChipVisibility);
    requestAnimationFrame(updateChipVisibility);
  };

  blockView.setSource(lastSource);
  scheduleChipSync();

  const play = async (): Promise<void> => {
    setState('loading');
    controls?.setState('loading');
    try {
      const engine = await getAudioEngine({
        ...(opts.samplesBaseUrl !== undefined ? { samplesBaseUrl: opts.samplesBaseUrl } : {}),
      });
      const handle = playSource(engine, lastSource, { mute });
      if (handle.durationSec <= 0) {
        setState('idle');
        return;
      }
      audioHandle = handle;
      setState('playing');
      // Song만 시각 플레이헤드가 있다 — blockView가 song일 때만 RAF tick.
      const songInfo = blockView.getSongTiming();
      if (songInfo) startSongPlayheadRaf(songInfo.bpm, songInfo.durationBeats);
      stopTimer = setTimeout(() => {
        stopAudio();
        setState('idle');
      }, handle.durationSec * 1000 + 500);
    } catch (err) {
      if (opts.onError) opts.onError(err);
      else console.warn('[ooon/player-web] playback failed', err);
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
    setMute(next) {
      mute = { ...next };
      blockView.setMute(mute);
      audioHandle?.setMute?.(mute);
      controls?.setMute(mute);
    },
    setSource(source) {
      stopAudio();
      if (state !== 'idle') setState('idle');
      lastSource = source;
      blockView.setSource(source);
      scheduleChipSync();
    },
    dispose() {
      stopAudio();
      stopRaf();
      controls?.dispose();
      blockView.dispose();
      if (host.contains(root)) host.removeChild(root);
    },
  };
}

/** 호환 별칭 — 기존 사용처가 `mount`로 import한 경우를 위해 유지. */
export const mount = mountBlockPlayer;

/**
 * 일반화된 이름 별칭 — "단일 블록 재생기"가 아니라 "재생 사용 사례" 단위 facade임을 드러낸다.
 * 어떤 블록(score/drum/progression/fretboard/song)이든 source 기반 자동 조립.
 */
export const mountPlayer = mountBlockPlayer;
export type PlayerOptions = BlockPlayerOptions;
export type PlayerHandle = BlockPlayerHandle;
