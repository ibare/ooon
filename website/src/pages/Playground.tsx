import { useState, type CSSProperties } from 'react';
import ScoreEditor from '../components/ScoreEditor';
import PlayerControls from '../components/PlayerControls';
import { useLang } from '../i18n/context';

// "비어있음"의 정의(L2): 헤더만 있는 score는 빈 한 마디로 해석된다.
// 이 캔버스가 편집 UX의 출발점 — 음표 0개의 마디 1개가 그려진다.
const EMPTY_SCORE_DSL = 'score 4/4';

export default function Playground() {
  const { t } = useLang();
  // 호스트가 DSL을 보관하고 두 컴포넌트(편집기/재생기)에 분배한다.
  // 편집기 onChange로 갱신된 dsl이 BlockPlayer.source로 흘러가, 편집 중인 악보를 그대로 재생할 수 있다.
  const [dsl, setDsl] = useState(EMPTY_SCORE_DSL);

  return (
    <section className="section">
      <div className="container">
        <div className="section__header">
          <h1 className="section__title">{t.playgroundPage.title}</h1>
          <p className="section__sub">{t.playgroundPage.sub}</p>
        </div>

        <div style={styles.canvasHost}>
          <ScoreEditor source={EMPTY_SCORE_DSL} onChange={setDsl} />
        </div>

        <div style={styles.playerHost}>
          <PlayerControls source={dsl} />
        </div>

        <pre style={styles.dslPreview}>{dsl}</pre>
      </div>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  canvasHost: {
    padding: '1.25em',
    background: '#fff',
    minHeight: '240px',
  },
  playerHost: {
    marginTop: '1em',
    padding: '1em',
    background: '#fff',
    border: '1px solid #e4e4e7',
    borderRadius: 6,
  },
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
