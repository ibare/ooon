import { useLang } from '../../i18n/context';

export default function IntroSection() {
  const { t } = useLang();
  const intro = t.getStartedPage.sections.intro;
  return (
    <section className="section">
      <div className="container container--text">
        <header className="get-started__section-header">
          <h1 className="get-started__title">{t.getStartedPage.title}</h1>
          <p className="get-started__sub">{t.getStartedPage.sub}</p>
        </header>
        <h2 className="get-started__h2">{intro.title}</h2>
        <p className="get-started__body">{intro.body}</p>
      </div>
    </section>
  );
}
