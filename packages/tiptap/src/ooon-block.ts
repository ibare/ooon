import { Node, mergeAttributes } from '@tiptap/core';
import { createOoonBlockView } from './ooon-block-view.js';
import type { OoonRuntime } from './runtime.js';

export interface OoonBlockOptions {
  runtime: OoonRuntime;
  HTMLAttributes?: Record<string, unknown>;
  showNoteNames?: boolean;
  defaultWidth?: number;
}

export const OoonBlock = Node.create<OoonBlockOptions>({
  name: 'ooonBlock',
  group: 'block',
  content: 'text*',
  code: true,
  defining: true,
  marks: '',

  addOptions(): OoonBlockOptions {
    return {
      runtime: undefined as unknown as OoonRuntime,
    };
  },

  parseHTML() {
    return [
      {
        tag: 'pre[data-ooon-block]',
        preserveWhitespace: 'full',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'pre',
      mergeAttributes({ 'data-ooon-block': 'true' }, this.options.HTMLAttributes ?? {}, HTMLAttributes),
      ['code', 0],
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const opts = this.options;
      const view = createOoonBlockView(node, {
        runtime: opts.runtime,
        ...(opts.showNoteNames !== undefined ? { showNoteNames: opts.showNoteNames } : {}),
        ...(opts.defaultWidth !== undefined ? { defaultWidth: opts.defaultWidth } : {}),
      });
      return {
        dom: view.dom,
        update(updated) {
          if (updated.type.name !== 'ooonBlock') return false;
          view.update(updated.textContent);
          return true;
        },
        destroy() {
          view.destroy();
        },
      };
    };
  },
});
