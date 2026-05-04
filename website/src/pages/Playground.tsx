import { useState, type CSSProperties } from 'react';
import PlaygroundView from '../components/PlaygroundView';
import { useLang } from '../i18n/context';

// "비어있음"의 정의(L2): 헤더만 있는 score는 빈 한 마디로 해석된다.
const EMPTY_SCORE_DSL = 'score 4/4';

export default function Playground() {
  const { t } = useLang();
  const [dsl, setDsl] = useState(EMPTY_SCORE_DSL);

  return (
    <section className="section">
      <div className="container">
        <div className="section__header">
          <h1 className="section__title">{t.playgroundPage.title}</h1>
          <p className="section__sub">{t.playgroundPage.sub}</p>
        </div>

        <PlaygroundView source={EMPTY_SCORE_DSL} onChange={setDsl} />

        <pre style={styles.dslPreview}>{dsl}</pre>
      </div>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  dslPreview: {
    marginTop: '1em',
    padding: '0.75em',
    background: '#0f172a',
    color: '#e2e8f0',
    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
    fontSize: '0.85em',
    borderRadius: 6,
    whiteSpace: 'pre-wrap',
  },
};
