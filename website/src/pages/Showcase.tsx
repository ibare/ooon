import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CodeBlock from '../components/CodeBlock';
import PlayButton from '../components/PlayButton';
import RenderBlock from '../components/RenderBlock';
import { showcase } from '../data/showcase-data';
import { useLang } from '../i18n/context';

export default function Showcase() {
  const { t, lang } = useLang();
  const { genre } = useParams<{ genre: string }>();
  const activeId = genre ?? showcase[0]?.id ?? 'blues';
  const active = showcase.find((s) => s.id === activeId) ?? showcase[0];
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setPlaying(false);
  }, [activeId]);

  return (
    <section className="section">
      <div className="container">
        <div className="section__header">
          <h1 className="section__title">{t.showcasePage.title}</h1>
          <p className="section__sub">{t.showcasePage.sub}</p>
        </div>

        <div className="tabs" style={{ marginBottom: '2em' }} role="tablist">
          {showcase.map((item) => (
            <Link
              key={item.id}
              to={`/${lang}/showcase/${item.id}`}
              role="tab"
              aria-selected={item.id === activeId}
              className={`tabs__tab${item.id === activeId ? ' tabs__tab--active' : ''}`}
            >
              {t.showcasePage.genres[item.id] ?? item.title}
            </Link>
          ))}
        </div>

        {active && (
          <article>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1em',
                marginBottom: '1em',
              }}
            >
              <div>
                <h2 style={{ fontSize: '1.4em', marginBottom: '0.2em' }}>{active.title}</h2>
                <p style={{ color: 'var(--color-muted)', fontSize: '0.9em' }}>{active.subtitle}</p>
              </div>
              <PlayButton source={active.source} onPlayingChange={setPlaying} />
            </div>
            <div className="grid grid--2">
              <div>
                <div
                  style={{
                    fontSize: '0.8em',
                    color: 'var(--color-muted)',
                    marginBottom: '0.4em',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {t.showcasePage.source_label}
                </div>
                <CodeBlock code={active.source} lang="text" />
              </div>
              <div>
                <div
                  style={{
                    fontSize: '0.8em',
                    color: 'var(--color-muted)',
                    marginBottom: '0.4em',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {t.showcasePage.render_label}
                </div>
                <RenderBlock source={active.source} width={560} playing={playing} />
              </div>
            </div>
          </article>
        )}
      </div>
    </section>
  );
}
