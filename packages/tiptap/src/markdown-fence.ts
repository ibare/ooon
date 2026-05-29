import type { Node as PmNode, Schema } from '@tiptap/pm/model';

export const OOON_NODE_NAME = 'ooonBlock';
export const OOON_FENCE_LANG = 'ooon';
export const OOON_FENCE_RE = /^ooon$/;

export function ooonNodeToMarkdown(node: PmNode): string {
  if (node.type.name !== OOON_NODE_NAME) {
    throw new Error(
      `ooonNodeToMarkdown: expected node type "${OOON_NODE_NAME}", got "${node.type.name}"`,
    );
  }
  return '```' + OOON_FENCE_LANG + '\n' + node.textContent + '\n```';
}

export function createOoonNodeFromSource(schema: Schema, source: string): PmNode {
  const type = schema.nodes[OOON_NODE_NAME];
  if (!type) {
    throw new Error(
      `createOoonNodeFromSource: schema is missing node "${OOON_NODE_NAME}" — register OoonBlock first`,
    );
  }
  const content = source.length > 0 ? [schema.text(source)] : [];
  return type.create(null, content);
}
