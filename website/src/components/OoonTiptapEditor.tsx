import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { OoonBlock, OoonInline, OoonRuntime } from '@ooon/tiptap';
import bravuraUrl from '@ooon/tiptap/font/Bravura.woff2?url';
import { useEffect, useMemo } from 'react';
import { parseMarkdownToDoc, serializeDocToMarkdown } from '../lib/markdown';

export interface OoonTiptapEditorProps {
  initialMarkdown: string;
  onMarkdownChange?(md: string): void;
}

export default function OoonTiptapEditor({
  initialMarkdown,
  onMarkdownChange,
}: OoonTiptapEditorProps) {
  const runtime = useMemo(() => new OoonRuntime({ bravuraUrl }), []);
  useEffect(() => () => runtime.dispose(), [runtime]);

  const editor = useEditor({
    extensions: [
      // StarterKit 의 codeBlock 은 OoonBlock 이 대체. trama-chain INTEGRATION-METHII 권고 동일.
      StarterKit.configure({ codeBlock: false }),
      OoonBlock.configure({ runtime }),
      OoonInline.configure({ runtime }),
    ],
    // schema 가 준비된 시점(onCreate)에 마크다운을 파싱해 doc 으로 주입.
    // useEditor 의 content 옵션은 함수형 시그니처를 지원하지 않는다.
    onCreate: ({ editor }) => {
      const doc = parseMarkdownToDoc(editor.schema, initialMarkdown);
      editor.commands.setContent(doc.toJSON(), false);
    },
    onUpdate: ({ editor }) => {
      onMarkdownChange?.(serializeDocToMarkdown(editor.state.doc));
    },
  });

  return <EditorContent editor={editor} />;
}
