import { describe, expect, it } from 'vitest';
import { Schema } from '@tiptap/pm/model';
import {
  OOON_FENCE_LANG,
  OOON_FENCE_RE,
  OOON_NODE_NAME,
  createOoonNodeFromSource,
  ooonNodeToMarkdown,
} from './markdown-fence.js';

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    text: { group: 'inline' },
    paragraph: { group: 'block', content: 'inline*', toDOM: () => ['p', 0] },
    [OOON_NODE_NAME]: {
      group: 'block',
      content: 'text*',
      code: true,
      defining: true,
      marks: '',
      toDOM: () => ['pre', { 'data-ooon-block': 'true' }, ['code', 0]],
    },
  },
});

describe('OOON_FENCE_RE', () => {
  it('정확히 "ooon" 만 매치한다', () => {
    expect(OOON_FENCE_RE.test('ooon')).toBe(true);
    expect(OOON_FENCE_RE.test('ooonish')).toBe(false);
    expect(OOON_FENCE_RE.test('oooN')).toBe(false);
    expect(OOON_FENCE_RE.test(' ooon ')).toBe(false);
    expect(OOON_FENCE_RE.test('oon')).toBe(false);
  });
});

describe('createOoonNodeFromSource', () => {
  it('source 텍스트를 ooonBlock 본문으로 가진 노드를 생성한다', () => {
    const node = createOoonNodeFromSource(schema, 'score C major');
    expect(node.type.name).toBe(OOON_NODE_NAME);
    expect(node.textContent).toBe('score C major');
  });

  it('빈 source 도 안전하게 빈 노드를 생성한다', () => {
    const node = createOoonNodeFromSource(schema, '');
    expect(node.type.name).toBe(OOON_NODE_NAME);
    expect(node.textContent).toBe('');
    expect(node.childCount).toBe(0);
  });

  it('스키마에 ooonBlock 노드가 없으면 throw 한다', () => {
    const bareSchema = new Schema({
      nodes: { doc: { content: 'text*' }, text: {} },
    });
    expect(() => createOoonNodeFromSource(bareSchema, 'x')).toThrow(/ooonBlock/);
  });
});

describe('ooonNodeToMarkdown', () => {
  it('node.textContent 를 ooon fence 로 감싼다', () => {
    const node = createOoonNodeFromSource(schema, 'progression I-V-vi-IV');
    expect(ooonNodeToMarkdown(node)).toBe(
      '```' + OOON_FENCE_LANG + '\nprogression I-V-vi-IV\n```',
    );
  });

  it('여러 줄 source 도 그대로 보존한다', () => {
    const src = 'score\n  tempo 120\n  C D E';
    const node = createOoonNodeFromSource(schema, src);
    expect(ooonNodeToMarkdown(node)).toBe('```ooon\n' + src + '\n```');
  });

  it('다른 노드 타입을 받으면 throw 한다', () => {
    const para = schema.nodes.paragraph!.create(null, [schema.text('hello')]);
    expect(() => ooonNodeToMarkdown(para)).toThrow(/expected node type "ooonBlock"/);
  });
});

describe('round-trip', () => {
  it('createOoonNodeFromSource → ooonNodeToMarkdown 라운드트립이 무손실이다', () => {
    const sources = [
      'score C',
      'drum\n  pattern X--X--X-',
      'fretboard\n  E A D G B E',
      'progression\n  I IV V I',
    ];
    for (const src of sources) {
      const node = createOoonNodeFromSource(schema, src);
      const md = ooonNodeToMarkdown(node);
      expect(md).toBe('```ooon\n' + src + '\n```');
      const fenceBody = md.replace(/^```ooon\n/, '').replace(/\n```$/, '');
      expect(fenceBody).toBe(src);
    }
  });
});
