import { Link, useParams } from 'react-router-dom';
import BlockPlayer from '../components/BlockPlayer';
import CodeBlock from '../components/CodeBlock';
import { examples } from '../data/examples-data';
import { useLang } from '../i18n/context';

export default function Examples() {
  const { t, lang } = useLang();
  const { category } = useParams<{ category: string }>();
  const activeId = category ?? examples[0]?.id ?? 'score';
  const active = examples.find((c) => c.id === activeId) ?? examples[0];

  return (
    <section className="section">
      <div className="container">
        <div className="section__header">
          <h1 className="section__title">{t.examplesPage.title}</h1>
          <p className="section__sub">{t.examplesPage.sub}</p>
        </div>

        <div className="tabs" style={{ marginBottom: '2em' }} role="tablist">
          {examples.map((cat) => (
            <Link
              key={cat.id}
              to={`/${lang}/examples/${cat.id}`}
              role="tab"
              aria-selected={cat.id === activeId}
              className={`tabs__tab${cat.id === activeId ? ' tabs__tab--active' : ''}`}
            >
              {t.examplesPage.categories[cat.id] ?? cat.id}
            </Link>
          ))}
        </div>

        <div style={{ display: 'grid', gap: '2.5em' }}>
          {active?.items.map((item) => (
            <article key={item.id}>
              <h3 style={{ fontSize: '1.1em', marginBottom: '0.8em' }}>{item.title}</h3>
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
                    {t.examplesPage.source_label}
                  </div>
                  <CodeBlock code={item.source} lang="text" />
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
                    {t.examplesPage.render_label}
                  </div>
                  <BlockPlayer source={item.source} width={480} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
