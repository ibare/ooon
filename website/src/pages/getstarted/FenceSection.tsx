import CodeBlock from '../../components/CodeBlock';
import { useLang } from '../../i18n/context';

const FENCE_MARKDOWN = `# Music notes

C major scale ascending:

\`\`\`ooon
score 4/4
  C4/q D4/q E4/q F4/q | G4/q A4/q B4/q C5/q |
\`\`\``;

const FENCE_CODE = `import {
  OOON_FENCE_LANG,         // 'ooon'
  OOON_NODE_NAME,          // 'ooonBlock'
  createOoonNodeFromSource,
  ooonNodeToMarkdown,
} from '@ooon/tiptap';

// markdown → ProseMirror
if (lang === OOON_FENCE_LANG) {
  return createOoonNodeFromSource(schema, fenceBody);
}

// ProseMirror → markdown
if (node.type.name === OOON_NODE_NAME) {
  return ooonNodeToMarkdown(node);
}`;

export default function FenceSection() {
  const { t } = useLang();
  const fence = t.getStartedPage.sections.fence;
  return (
    <section className="section section--alt">
      <div className="container container--text">
        <h2 className="get-started__h2">{fence.title}</h2>
        <p className="get-started__body">{fence.body}</p>
        <h3 className="get-started__h3">markdown</h3>
        <CodeBlock code={FENCE_MARKDOWN} lang="md" />
        <h3 className="get-started__h3">tokenizer / serializer</h3>
        <CodeBlock code={FENCE_CODE} lang="ts" />
        <p className="get-started__note">{fence.tokenizer_note}</p>
      </div>
    </section>
  );
}
