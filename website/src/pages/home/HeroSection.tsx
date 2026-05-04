import { Link, useParams } from 'react-router-dom';
import { useLang } from '../../i18n/context';
import BlockPlayer from '../../components/BlockPlayer';

const DEMO_SOURCE = 'score 4/4\n  C4/q E4/q G4/q C5/q | G4/q E4/q C4/q r/q |';

export default function HeroSection() {
  const { t } = useLang();
  const { lang } = useParams<{ lang: string }>();

  return (
    <section className="section">
      <div className="container" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.4em', fontWeight: 700, letterSpacing: '-0.02em' }}>
          {t.hero.headline}
        </h1>
        <p
          style={{
            marginTop: '1em',
            fontSize: '1.05em',
            color: 'var(--color-muted)',
            maxWidth: 'var(--text-max)',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {t.hero.sub}
        </p>
        <div style={{ marginTop: '1.8em', display: 'flex', gap: '0.8em', justifyContent: 'center' }}>
          <Link to={`/${lang}/examples`} className="btn btn--primary">
            {t.hero.cta_start}
          </Link>
          <a
            href="https://github.com/ibare/oon"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--outline"
          >
            {t.hero.cta_github}
          </a>
        </div>
        <div style={{ marginTop: '3em', maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
          <BlockPlayer source={DEMO_SOURCE} />
        </div>
      </div>
    </section>
  );
}
