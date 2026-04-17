import { useEffect, useState } from 'react';
import { codeToHtml } from 'shiki';
import CopyButton from './CopyButton';

export interface CodeBlockProps {
  code: string;
  lang?: string;
}

export default function CodeBlock({ code, lang = 'text' }: CodeBlockProps) {
  const [html, setHtml] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    void codeToHtml(code, { lang, theme: 'github-dark' }).then((out) => {
      if (!cancelled) setHtml(out);
    });
    return () => {
      cancelled = true;
    };
  }, [code, lang]);

  if (!html) {
    return (
      <div className="code-block">
        <CopyButton text={code} />
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className="code-block code-block--highlighted">
      <CopyButton text={code} />
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
