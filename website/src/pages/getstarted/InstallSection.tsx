import CodeBlock from '../../components/CodeBlock';
import { useLang } from '../../i18n/context';

export default function InstallSection() {
  const { t } = useLang();
  const install = t.getStartedPage.sections.install;
  return (
    <section className="section section--alt">
      <div className="container container--text">
        <h2 className="get-started__h2">{install.title}</h2>
        <p className="get-started__body">{install.body}</p>
        <CodeBlock code="pnpm add @ooon/tiptap" lang="bash" />
        <h3 className="get-started__h3">{install.peer_label}</h3>
        <table className="peer-table">
          <thead>
            <tr>
              <th>package</th>
              <th>range</th>
            </tr>
          </thead>
          <tbody>
            {install.peers.map((p) => (
              <tr key={p.name}>
                <td><code>{p.name}</code></td>
                <td><code>{p.range}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
