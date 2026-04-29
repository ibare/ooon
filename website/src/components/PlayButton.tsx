import { useEffect, useRef, useState } from 'react';
import { getAudioEngine } from '../audio/engine';
import { playSource, type PlaybackHandle } from '../audio/playback';
import { useLang } from '../i18n/context';

export interface PlayButtonProps {
  source: string;
  onPlayingChange?: (playing: boolean) => void;
}

type State = 'idle' | 'loading' | 'playing';

export default function PlayButton({ source, onPlayingChange }: PlayButtonProps) {
  const { t } = useLang();
  const [state, setState] = useState<State>('idle');
  const handleRef = useRef<PlaybackHandle | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const wasPlayingRef = useRef(false);
  const onPlayingChangeRef = useRef(onPlayingChange);
  onPlayingChangeRef.current = onPlayingChange;

  useEffect(
    () => () => {
      handleRef.current?.stop();
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      if (wasPlayingRef.current) {
        wasPlayingRef.current = false;
        onPlayingChangeRef.current?.(false);
      }
    },
    [],
  );

  function reset(): void {
    handleRef.current = null;
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setState('idle');
    if (wasPlayingRef.current) {
      wasPlayingRef.current = false;
      onPlayingChangeRef.current?.(false);
    }
  }

  async function handleClick(): Promise<void> {
    if (state === 'playing') {
      handleRef.current?.stop();
      reset();
      return;
    }
    if (state === 'loading') return;

    setState('loading');
    try {
      const engine = await getAudioEngine();
      const handle = playSource(engine, source);
      if (handle.durationSec <= 0) {
        setState('idle');
        return;
      }
      handleRef.current = handle;
      setState('playing');
      wasPlayingRef.current = true;
      onPlayingChangeRef.current?.(true);
      timeoutRef.current = window.setTimeout(() => {
        reset();
      }, handle.durationSec * 1000 + 500);
    } catch {
      setState('idle');
    }
  }

  const label =
    state === 'playing' ? t.examplesPage.stop : state === 'loading' ? '…' : t.examplesPage.play;

  return (
    <button
      type="button"
      onClick={() => {
        void handleClick();
      }}
      className="btn btn--outline"
      style={{ fontSize: '0.85em', padding: '0.3em 0.9em' }}
      aria-label={label}
    >
      {label}
    </button>
  );
}
