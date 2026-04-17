import { useLang } from '../../i18n/context';

export default function ProblemSection() {
  const { t } = useLang();
  return (
    <section className="section section--alt">
      <div className="container">
        <div className="section__header">
          <h2 className="section__title">{t.problem.title}</h2>
          <p className="section__sub">{t.problem.sub}</p>
        </div>
        <div className="grid grid--2">
          <div className="card">
            <div className="card__title">{t.problem.current_title}</div>
            <ul style={{ paddingLeft: '1.2em', marginTop: '0.6em' }}>
              {t.problem.current_items.map((it) => (
                <li key={it} style={{ marginTop: '0.3em', color: 'var(--color-muted)' }}>
                  {it}
                </li>
              ))}
            </ul>
          </div>
          <div className="card" style={{ borderColor: 'var(--color-accent)' }}>
            <div className="card__title" style={{ color: 'var(--color-accent)' }}>
              {t.problem.oon_title}
            </div>
            <ul style={{ paddingLeft: '1.2em', marginTop: '0.6em' }}>
              {t.problem.oon_items.map((it) => (
                <li key={it} style={{ marginTop: '0.3em' }}>
                  {it}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
