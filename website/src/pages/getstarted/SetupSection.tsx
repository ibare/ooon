import CodeBlock from '../../components/CodeBlock';
import { useLang } from '../../i18n/context';

const SETUP_CODE = `import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { OoonRuntime, OoonBlock, OoonInline } from '@ooon/tiptap';
import bravuraUrl from '@ooon/tiptap/font/Bravura.woff2?url';

const runtime = new OoonRuntime({ bravuraUrl });

new Editor({
  element: document.querySelector('#editor')!,
  extensions: [
    StarterKit.configure({ codeBlock: false }),
    OoonBlock.configure({ runtime }),
    OoonInline.configure({ runtime }),
  ],
});`;

export default function SetupSection() {
  const { t } = useLang();
  const setup = t.getStartedPage.sections.setup;
  return (
    <section className="section">
      <div className="container container--text">
        <h2 className="get-started__h2">{setup.title}</h2>
        <p className="get-started__body">{setup.body}</p>
        <CodeBlock code={SETUP_CODE} lang="ts" />
        <p className="get-started__note">{setup.font_note}</p>
      </div>
    </section>
  );
}
