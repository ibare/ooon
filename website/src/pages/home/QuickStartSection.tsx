import CodeBlock from '../../components/CodeBlock';
import { useLang } from '../../i18n/context';

const TIPTAP_USAGE = `import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { OoonRuntime, OoonBlock, OoonInline } from '@ooon/tiptap';

const runtime = new OoonRuntime({
  bravuraUrl: '/fonts/Bravura.woff2',
});

new Editor({
  element: document.querySelector('#editor')!,
  extensions: [
    StarterKit,
    OoonBlock.configure({ runtime }),
    OoonInline.configure({ runtime }),
  ],
});`;

export default function QuickStartSection() {
  const { t } = useLang();
  return (
    <section className="section section--alt">
      <div className="container">
        <div className="section__header">
          <h2 className="section__title">{t.quickStart.title}</h2>
          <p className="section__sub">{t.quickStart.sub}</p>
        </div>
        <div style={{ display: 'grid', gap: '1.5em' }}>
          <CodeBlock code={t.quickStart.install} lang="bash" />
          <div>
            <div
              style={{
                fontSize: '0.85em',
                color: 'var(--color-muted)',
                marginBottom: '0.5em',
              }}
            >
              {t.quickStart.usage_label}
            </div>
            <CodeBlock code={TIPTAP_USAGE} lang="ts" />
          </div>
        </div>
      </div>
    </section>
  );
}
