import { Link } from 'react-router-dom';
import { useLang } from '../../i18n/context';

export default function NextStepsSection() {
  const { t, lang } = useLang();
  const next = t.getStartedPage.sections.next;
  const cards = [
    { to: 'showcase', copy: next.showcase },
    { to: 'syntax', copy: next.syntax },
    { to: 'playground', copy: next.playground },
  ];
  return (
    <section className="section section--alt">
      <div className="container">
        <header className="get-started__section-header">
          <h2 className="get-started__h2">{next.title}</h2>
          <p className="get-started__body">{next.body}</p>
        </header>
        <div className="grid grid--3 next-steps">
          {cards.map(({ to, copy }) => (
            <Link key={to} to={`/${lang}/${to}`} className="next-steps__card">
              <h3 className="next-steps__title">{copy.title}</h3>
              <p className="next-steps__desc">{copy.desc}</p>
              <span className="next-steps__arrow">→</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
