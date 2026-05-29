import { parseBlock, type BlockNode } from '@ooon/core';
import type { TrackMute } from '@ooon/shared';
import {
  createControlsBar,
  DEFAULT_LABELS_EN,
  type ControlsBarHandle,
  type PlayerLabels,
  type TrackKey,
} from './controls-bar.js';
import { getAudioEngine, type EngineFactoryOptions } from './audio/engine-factory.js';
import { playSource, type PlaybackHandle } from './audio/playback.js';

export interface PlayerControlsOptions extends EngineFactoryOptions {
  /** DSL 소스 문자열. node와 둘 중 하나는 필수. */
  source?: string;
  /** 미리 파싱된 노드. source와 둘 중 하나는 필수. */
  node?: BlockNode;
  /** 컨트롤 라벨. 미지정 시 영문 기본. */
  labels?: PlayerLabels;
  /** 초기 mute. */
  mute?: TrackMute;
  onPlayingChange?(playing: boolean): void;
  /** 재생 오류(엔진 init 실패, 샘플 로드 실패 등) 통지. 미주입 시 console.warn으로 fallback. */
  onError?(err: unknown): void;
}

export interface PlayerControlsHandle {
  play(): Promise<void>;
  stop(): void;
  setMute(mute: TrackMute): void;
  setSource(source: string | BlockNode): void;
  dispose(): void;
}

type State = 'idle' | 'loading' | 'playing';

/**
 * 시각화 없는 재생 컨트롤 — 편집기처럼 시각화는 다른 컴포넌트가 담당하는 호스트에서 사용.
 * ▶ 버튼과 (Song인 경우) 트랙 chip만 host에 부착한다.
 * 시각화가 필요한 단독 재생기는 `mountBlockPlayer`를 쓴다.
 */
export function mountControls(
  host: HTMLElement,
  opts: PlayerControlsOptions,
): PlayerControlsHandle {
  if (opts.source === undefined && opts.node === undefined) {
    throw new Error('@ooon/player-web: opts.source or opts.node must be provided');
  }
  const labels = opts.labels ?? DEFAULT_LABELS_EN;

  let state: State = 'idle';
  let mute: TrackMute = { ...(opts.mute ?? {}) };
  let audioHandle: PlaybackHandle | null = null;
  let stopTimer: ReturnType<typeof setTimeout> | null = null;
  let lastSource: string | BlockNode = opts.source ?? opts.node!;

  const setState = (next: State): void => {
    state = next;
    controls.setState(state);
    opts.onPlayingChange?.(next === 'playing');
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
    audioHandle?.setMute?.(mute);
    controls.setMute(mute);
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

  const controls: ControlsBarHandle = createControlsBar(host, {
    labels,
    onPlayToggle: handlePlayToggle,
    onMuteToggle,
  });
  controls.setMute(mute);
  syncChipsFromSource(lastSource);

  function syncChipsFromSource(src: string | BlockNode): void {
    const isSong = detectIsSong(src);
    controls.setShowChips(isSong);
  }

  const play = async (): Promise<void> => {
    setState('loading');
    controls.setState('loading');
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
      audioHandle?.setMute?.(mute);
      controls.setMute(mute);
    },
    setSource(source) {
      stopAudio();
      if (state !== 'idle') setState('idle');
      lastSource = source;
      syncChipsFromSource(source);
    },
    dispose() {
      stopAudio();
      controls.dispose();
    },
  };
}

function detectIsSong(source: string | BlockNode): boolean {
  if (typeof source !== 'string') return source.type === 'song';
  try {
    return parseBlock(source).type === 'song';
  } catch {
    return false;
  }
}
