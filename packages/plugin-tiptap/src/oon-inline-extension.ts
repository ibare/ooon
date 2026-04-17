import { Extension } from '@tiptap/core';
import { createOonInlinePlugin } from './oon-inline.js';
import type { OonRuntime } from './runtime.js';

export interface OonInlineExtensionOptions {
  runtime: OonRuntime;
  className?: string;
  container?: HTMLElement;
}

export const OonInline = Extension.create<OonInlineExtensionOptions>({
  name: 'oonInline',

  addOptions(): OonInlineExtensionOptions {
    return {
      runtime: undefined as unknown as OonRuntime,
    };
  },

  addProseMirrorPlugins() {
    return [
      createOonInlinePlugin({
        runtime: this.options.runtime,
        ...(this.options.className !== undefined ? { className: this.options.className } : {}),
        ...(this.options.container !== undefined ? { container: this.options.container } : {}),
      }),
    ];
  },
});
