import { Extension } from '@tiptap/core';
import { createOoonInlinePlugin } from './ooon-inline.js';
import type { OoonRuntime } from './runtime.js';

export interface OoonInlineExtensionOptions {
  runtime: OoonRuntime;
  className?: string;
  container?: HTMLElement;
}

export const OoonInline = Extension.create<OoonInlineExtensionOptions>({
  name: 'oonInline',

  addOptions(): OoonInlineExtensionOptions {
    return {
      runtime: undefined as unknown as OoonRuntime,
    };
  },

  addProseMirrorPlugins() {
    return [
      createOoonInlinePlugin({
        runtime: this.options.runtime,
        ...(this.options.className !== undefined ? { className: this.options.className } : {}),
        ...(this.options.container !== undefined ? { container: this.options.container } : {}),
      }),
    ];
  },
});
