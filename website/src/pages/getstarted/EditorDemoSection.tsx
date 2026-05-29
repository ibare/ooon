import { useState } from 'react';
import OoonTiptapEditor from '../../components/OoonTiptapEditor';
import { useLang } from '../../i18n/context';

const INITIAL_KO = `# Ooon 에디터 데모

마크다운 본문에 \`\`\`ooon\` 펜스로 블록을 끼우면 NodeView 가 캔버스로 렌더한다.

\`\`\`ooon
score 4/4
  C4/q D4/q E4/q F4/q | G4/q A4/q B4/q C5/q |
\`\`\`

화성 진행도 같은 방식으로 그릴 수 있다.

\`\`\`ooon
progression 4/4 in:C
  I | V | vi | IV |
\`\`\`

펜스 본문을 편집하면 아래 마크다운 출력이 실시간으로 갱신된다.`;

const INITIAL_EN = `# Ooon editor demo

Embed a \`\`\`ooon\` fence inside your markdown and the block renders as a NodeView on canvas.

\`\`\`ooon
score 4/4
  C4/q D4/q E4/q F4/q | G4/q A4/q B4/q C5/q |
\`\`\`

Chord progressions work the same way.

\`\`\`ooon
progression 4/4 in:C
  I | V | vi | IV |
\`\`\`

Edit any fence body above and the markdown output below updates in real time.`;

export default function EditorDemoSection() {
  const { t, lang } = useLang();
  const tryCopy = t.getStartedPage.sections.try;
  const initial = lang === 'ko' ? INITIAL_KO : INITIAL_EN;
  const [markdown, setMarkdown] = useState<string>(initial);

  return (
    <section className="section">
      <div className="container">
        <header className="get-started__section-header get-started__section-header--wide">
          <h2 className="get-started__h2">{tryCopy.title}</h2>
          <p className="get-started__body">{tryCopy.body}</p>
        </header>

        <div className="editor-demo">
          <div className="editor-demo__editor">
            <OoonTiptapEditor initialMarkdown={initial} onMarkdownChange={setMarkdown} />
          </div>
          <div className="editor-demo__source">
            <header className="editor-demo__source-header">
              {lang === 'ko' ? '저장될 마크다운 (round-trip 결과)' : 'Stored markdown (round-trip output)'}
            </header>
            <pre className="editor-demo__source-code">
              <code>{markdown}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
