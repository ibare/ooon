import Card from '../../components/Card';
import { useLang } from '../../i18n/context';

export default function FeaturesSection() {
  const { t } = useLang();
  return (
    <section className="section">
      <div className="container">
        <div className="section__header">
          <h2 className="section__title">{t.features.title}</h2>
          <p className="section__sub">{t.features.sub}</p>
        </div>
        <div className="grid grid--3">
          {t.features.items.map((it) => (
            <Card key={it.title} title={it.title}>
              {it.desc}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
