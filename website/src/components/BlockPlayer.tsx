import { useEffect, useRef } from 'react';
import { mount, type BlockPlayerHandle, type PlayerLabels } from '@oon/player-web';
import { useLang } from '../i18n/context';

const KO_LABELS: PlayerLabels = {
  play: '재생',
  stop: '정지',
  loading: '…',
  chord: '코드',
  melody: '멜로디',
  drum: '비트',
};

export interface BlockPlayerProps {
  source: string;
  width?: number;
  showNoteNames?: boolean;
  hideControls?: boolean;
}

const BASE = import.meta.env.BASE_URL;

export default function BlockPlayer({
  source,
  width,
  showNoteNames,
  hideControls,
}: BlockPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<BlockPlayerHandle | null>(null);
  const { lang } = useLang();

  // mount 시점 옵션은 한 번만 결정 — width/labels 등이 바뀌면 컴포넌트가 재마운트되어 재생성된다.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handle = mount(el, {
      source,
      ...(width !== undefined ? { width } : {}),
      ...(showNoteNames !== undefined ? { showNoteNames } : {}),
      ...(hideControls !== undefined ? { hideControls } : {}),
      ...(lang === 'ko' ? { labels: KO_LABELS } : {}),
      samplesBaseUrl: `${BASE}samples`,
      bravuraUrl: `${BASE}fonts/Bravura.woff2`,
    });
    handleRef.current = handle;
    return () => {
      handle.dispose();
      handleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, showNoteNames, hideControls, lang]);

  useEffect(() => {
    handleRef.current?.setSource(source);
  }, [source]);

  return <div ref={containerRef} />;
}
