# @ooon/tiptap

Tiptap 에디터용 Ooon 확장. 외부 호스트(예: methii)가 단일 의존성으로 Ooon 전체 기능을 사용할 수 있도록 내부 `@ooon/*` workspace를 단일 ESM 번들에 inline한다.

## 설치

```bash
pnpm add @ooon/tiptap
```

## peer dependencies

호스트가 직접 제공해야 하는 의존성:

- `@tiptap/core >= 2.6`
- `@tiptap/pm >= 2.6`
- `smplr >= 0.20`

## 사용

```ts
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { OoonRuntime, OoonBlock, OoonInline } from '@ooon/tiptap';
import bravuraUrl from '@ooon/tiptap/font/Bravura.woff2?url';

const runtime = new OoonRuntime({ bravuraUrl });

new Editor({
  element: document.querySelector('#editor')!,
  extensions: [
    StarterKit,
    OoonBlock.configure({ runtime }),
    OoonInline.configure({ runtime }),
  ],
});
```

## fence round-trip 직렬화

마크다운의 ```` ```ooon ```` 펜스와 ProseMirror `ooonBlock` 노드 사이를 양방향 변환하는 헬퍼:

```ts
import {
  OOON_NODE_NAME,      // 'ooonBlock'
  OOON_FENCE_LANG,     // 'ooon'
  OOON_FENCE_RE,       // /^ooon$/
  ooonNodeToMarkdown,
  createOoonNodeFromSource,
} from '@ooon/tiptap';
```

- `createOoonNodeFromSource(schema, source)` — 마크다운 토크나이저가 `lang === 'ooon'` 분기에서 ProseMirror 노드를 생성할 때.
- `ooonNodeToMarkdown(node)` — ProseMirror → 마크다운 직렬화기에서 `node.type.name === OOON_NODE_NAME` 분기.

`ooonBlock` 노드 본문은 DSL 원문 텍스트를 그대로 보존하므로 라운드트립은 무손실이다.
