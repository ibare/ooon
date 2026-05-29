import { useEffect, useRef } from 'react';
import { mountPlayground, type PlaygroundHandle, type PlayerLabels } from '@ooon/player-web';
import { useLang } from '../i18n/context';

const KO_LABELS: PlayerLabels = {
  play: '재생',
  stop: '정지',
  loading: '…',
  chord: '코드',
  melody: '멜로디',
  drum: '비트',
};

export interface PlaygroundViewProps {
  source: string;
  onChange?(dsl: string): void;
}

const BASE = import.meta.env.BASE_URL;

// 호스트 책임은 source 공급 + 영역 확보뿐. 컨트롤바 → 키보드 → 편집기 조립 순서와 형태는 facade가 강제한다.
export default function PlaygroundView({ source, onChange }: PlaygroundViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<PlaygroundHandle | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const { lang } = useLang();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handle = mountPlayground(el, {
      source,
      ...(lang === 'ko' ? { labels: KO_LABELS } : {}),
      samplesBaseUrl: `${BASE}samples`,
      bravuraUrl: `${BASE}fonts/Bravura.woff2`,
      onChange: (dsl) => onChangeRef.current?.(dsl),
    });
    handleRef.current = handle;
    return () => {
      handle.dispose();
      handleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  return <div ref={containerRef} />;
}
