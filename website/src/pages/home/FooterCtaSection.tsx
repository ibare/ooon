import { useLang } from '../../i18n/context';

export default function FooterCtaSection() {
  const { t } = useLang();
  return (
    <section className="section">
      <div className="container" style={{ textAlign: 'center' }}>
        <h2 className="section__title">{t.footerCta.title}</h2>
        <div style={{ marginTop: '1.4em', display: 'flex', gap: '0.8em', justifyContent: 'center' }}>
          <a
            href="https://github.com/ibare/ooon"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--primary"
          >
            {t.footerCta.cta_github}
          </a>
          <a
            href="https://www.npmjs.com/search?q=%40ooon"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--outline"
          >
            {t.footerCta.cta_npm}
          </a>
        </div>
      </div>
    </section>
  );
}
