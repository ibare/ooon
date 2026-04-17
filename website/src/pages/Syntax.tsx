import { Link, useParams } from 'react-router-dom';
import CodeBlock from '../components/CodeBlock';
import { syntax } from '../data/syntax-data';
import { useLang } from '../i18n/context';

export default function Syntax() {
  const { t, lang } = useLang();
  const { section } = useParams<{ section: string }>();
  const activeId = section ?? syntax[0]?.id ?? 'overview';
  const active = syntax.find((s) => s.id === activeId) ?? syntax[0];

  return (
    <section className="section">
      <div className="container">
        <div className="section__header">
          <h1 className="section__title">{t.syntaxPage.title}</h1>
          <p className="section__sub">{t.syntaxPage.sub}</p>
        </div>

        <div className="tabs" style={{ marginBottom: '2em' }} role="tablist">
          {syntax.map((sec) => (
            <Link
              key={sec.id}
              to={`/${lang}/syntax/${sec.id}`}
              role="tab"
              aria-selected={sec.id === activeId}
              className={`tabs__tab${sec.id === activeId ? ' tabs__tab--active' : ''}`}
            >
              {t.syntaxPage.sections[sec.id] ?? sec.id}
            </Link>
          ))}
        </div>

        {active && (
          <div style={{ display: 'grid', gap: '1.5em' }}>
            <p style={{ color: 'var(--color-text)', lineHeight: 1.7 }}>{active.body}</p>
            {active.examples.map((ex) => (
              <div key={ex.label}>
                <div
                  style={{
                    fontSize: '0.8em',
                    color: 'var(--color-muted)',
                    marginBottom: '0.4em',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {ex.label}
                </div>
                <CodeBlock code={ex.code} lang="text" />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
