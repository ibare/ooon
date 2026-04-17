import { useState, type CSSProperties } from 'react';

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={() => {
        void handleCopy();
      }}
      style={styles.btn}
      aria-label="copy"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

const styles: Record<string, CSSProperties> = {
  btn: {
    position: 'absolute',
    top: '0.6em',
    right: '0.6em',
    background: 'rgba(255,255,255,0.08)',
    color: '#e2e8f0',
    border: '1px solid rgba(255,255,255,0.12)',
    padding: '0.25em 0.7em',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.75em',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};
