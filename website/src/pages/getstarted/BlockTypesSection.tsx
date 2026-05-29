import { Link, useParams } from 'react-router-dom';
import BlockPlayer from '../../components/BlockPlayer';
import CodeBlock from '../../components/CodeBlock';
import { examples } from '../../data/examples-data';
import { useLang } from '../../i18n/context';

export default function BlockTypesSection() {
  const { t, lang } = useLang();
  const { section } = useParams<{ section: string }>();
  const types = t.getStartedPage.sections.types;
  // examples-data 의 inline 카테고리는 §6(InlineSection)에서 별도로 다루므로
  // §5 탭에는 5개 블록 타입만 노출한다.
  const tabbed = examples.filter((c) => types.categories[c.id]);
  const active = tabbed.find((c) => c.id === section) ?? tabbed[0]!;

  return (
    <section className="section">
      <div className="container">
        <header className="get-started__section-header get-started__section-header--wide">
          <h2 className="get-started__h2">{types.title}</h2>
          <p className="get-started__body">{types.body}</p>
        </header>

        <nav className="tabs" aria-label="block types">
          {tabbed.map((cat) => {
            const isActive = cat.id === active.id;
            return (
              <Link
                key={cat.id}
                to={`/${lang}/get-started/${cat.id}`}
                className={isActive ? 'tabs__tab tabs__tab--active' : 'tabs__tab'}
              >
                {types.categories[cat.id] ?? cat.id}
              </Link>
            );
          })}
        </nav>

        <div className="block-types__items">
          {active.items.map((item) => (
            <article key={item.id} className="block-types__item">
              <h3 className="block-types__item-title">{item.title}</h3>
              <div className="grid grid--2 block-types__grid">
                <div>
                  <div className="block-types__label">{t.getStartedPage.source_label}</div>
                  <CodeBlock code={item.source} lang="text" />
                </div>
                <div>
                  <div className="block-types__label">{t.getStartedPage.render_label}</div>
                  <BlockPlayer source={item.source} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
