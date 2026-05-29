import type { CSSProperties } from 'react';
import { useLang } from '../i18n/context';

export default function Footer() {
  const { t } = useLang();

  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <span style={styles.tagline}>{t.footer.tagline}</span>
        <div style={styles.links}>
          <a
            href="https://github.com/ibare/ooon"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.link}
          >
            GitHub
          </a>
          <span style={styles.link}>MIT</span>
        </div>
      </div>
    </footer>
  );
}

const styles: Record<string, CSSProperties> = {
  footer: {
    borderTop: '1px solid var(--color-border)',
    padding: '2em 0',
  },
  container: {
    maxWidth: 'var(--container-max)',
    margin: '0 auto',
    padding: '0 1.5em',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.5em',
    fontSize: '0.85em',
    color: 'var(--color-muted)',
  },
  tagline: {},
  links: {
    display: 'flex',
    gap: '1.2em',
  },
  link: {
    color: 'var(--color-muted)',
    textDecoration: 'none',
    fontSize: '0.9em',
  },
};
