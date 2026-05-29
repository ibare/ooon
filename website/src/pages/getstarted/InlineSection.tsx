import CodeBlock from '../../components/CodeBlock';
import { useLang } from '../../i18n/context';

const INLINE_MARKDOWN = `# Use it in prose

A C major chord is \`ooon:Cmaj7\` and the scale is \`ooon:C major scale\`.
Single notes work too — middle C is \`ooon:C4\`.`;

export default function InlineSection() {
  const { t } = useLang();
  const inline = t.getStartedPage.sections.inline;
  return (
    <section className="section section--alt">
      <div className="container container--text">
        <h2 className="get-started__h2">{inline.title}</h2>
        <p className="get-started__body">{inline.body}</p>
        <CodeBlock code={INLINE_MARKDOWN} lang="md" />
      </div>
    </section>
  );
}
