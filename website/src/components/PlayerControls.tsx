import { useEffect, useRef } from 'react';
import { mountControls, type PlayerControlsHandle, type PlayerLabels } from '@oon/player-web';
import { useLang } from '../i18n/context';

const KO_LABELS: PlayerLabels = {
  play: '재생',
  stop: '정지',
  loading: '…',
  chord: '코드',
  melody: '멜로디',
  drum: '비트',
};

export interface PlayerControlsProps {
  source: string;
}

const BASE = import.meta.env.BASE_URL;

export default function PlayerControls({ source }: PlayerControlsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<PlayerControlsHandle | null>(null);
  const { lang } = useLang();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handle = mountControls(el, {
      source,
      ...(lang === 'ko' ? { labels: KO_LABELS } : {}),
      samplesBaseUrl: `${BASE}samples`,
    });
    handleRef.current = handle;
    return () => {
      handle.dispose();
      handleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    handleRef.current?.setSource(source);
  }, [source]);

  return <div ref={containerRef} />;
}
