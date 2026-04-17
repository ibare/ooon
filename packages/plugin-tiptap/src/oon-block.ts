import { Node, mergeAttributes } from '@tiptap/core';
import { createOonBlockView } from './oon-block-view.js';
import type { OonRuntime } from './runtime.js';

export interface OonBlockOptions {
  runtime: OonRuntime;
  HTMLAttributes?: Record<string, unknown>;
  showNoteNames?: boolean;
  defaultWidth?: number;
}

export const OonBlock = Node.create<OonBlockOptions>({
  name: 'oonBlock',
  group: 'block',
  content: 'text*',
  code: true,
  defining: true,
  marks: '',

  addOptions(): OonBlockOptions {
    return {
      runtime: undefined as unknown as OonRuntime,
    };
  },

  parseHTML() {
    return [
      {
        tag: 'pre[data-oon-block]',
        preserveWhitespace: 'full',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'pre',
      mergeAttributes({ 'data-oon-block': 'true' }, this.options.HTMLAttributes ?? {}, HTMLAttributes),
      ['code', 0],
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const opts = this.options;
      const view = createOonBlockView(node, {
        runtime: opts.runtime,
        ...(opts.showNoteNames !== undefined ? { showNoteNames: opts.showNoteNames } : {}),
        ...(opts.defaultWidth !== undefined ? { defaultWidth: opts.defaultWidth } : {}),
      });
      return {
        dom: view.dom,
        update(updated) {
          if (updated.type.name !== 'oonBlock') return false;
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
