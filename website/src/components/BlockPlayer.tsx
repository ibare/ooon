import { useEffect, useRef } from 'react';
import { mountPlayer, type PlayerHandle, type PlayerLabels } from '@oon/player-web';
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
  showNoteNames?: boolean;
  hideControls?: boolean;
}

const BASE = import.meta.env.BASE_URL;

// 호스트 책임은 source 공급 + 영역 확보뿐 — 폭/정렬/여백/박스는 facade가 결정한다.
// 영역 폭 제한이 필요하면 부모 컨테이너의 CSS(maxWidth 등)로 표현한다.
export default function BlockPlayer({ source, showNoteNames, hideControls }: BlockPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<PlayerHandle | null>(null);
  const { lang } = useLang();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handle = mountPlayer(el, {
      source,
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
  }, [showNoteNames, hideControls, lang]);

  useEffect(() => {
    handleRef.current?.setSource(source);
  }, [source]);

  return <div ref={containerRef} />;
}
