import { useEffect, useRef } from 'react';
import {
  mountScoreEditor,
  type ScoreEditorHandle,
} from '@oon/editor-web';

export interface ScoreEditorProps {
  source: string;
  width?: number;
  onChange?: (dsl: string) => void;
}

const BASE = import.meta.env.BASE_URL;

export default function ScoreEditor({ source, width, onChange }: ScoreEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<ScoreEditorHandle | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // 마운트는 한 번만 — source가 바뀌면 컴포넌트 자체가 재마운트되도록 key 사용 권장.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handle = mountScoreEditor(el, {
      source,
      ...(width !== undefined ? { width } : {}),
      bravuraUrl: `${BASE}fonts/Bravura.woff2`,
      samplesBaseUrl: `${BASE}samples`,
      onChange: (ev) => {
        onChangeRef.current?.(ev.dsl);
      },
    });
    handleRef.current = handle;
    return () => {
      handle.dispose();
      handleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width]);

  return (
    <div>
      <div ref={containerRef} />
      <div style={{ marginTop: '0.75em', display: 'flex', gap: '0.5em' }}>
        <button
          type="button"
          onClick={() => handleRef.current?.feelBeat()}
          style={{
            padding: '0.4em 0.9em',
            fontSize: '0.85em',
            border: '1px solid #d4d4d8',
            background: '#fafafa',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          박자 느끼기
        </button>
      </div>
    </div>
  );
}
