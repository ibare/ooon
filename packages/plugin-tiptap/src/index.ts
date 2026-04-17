export { OonRuntime } from './runtime.js';
export type { OonRuntimeOptions } from './runtime.js';

export { OonBlock } from './oon-block.js';
export type { OonBlockOptions } from './oon-block.js';

export { createOonBlockView } from './oon-block-view.js';
export type { OonBlockViewOptions, OonBlockViewHandle } from './oon-block-view.js';

export { OonInline } from './oon-inline-extension.js';
export type { OonInlineExtensionOptions } from './oon-inline-extension.js';

export { createOonInlinePlugin, oonInlinePluginKey } from './oon-inline.js';
export type { OonInlinePluginOptions } from './oon-inline.js';

export { openInlinePopover } from './inline-popover.js';
export type { InlinePopoverHandle, OpenInlinePopoverOptions } from './inline-popover.js';

export { renderBlockToProjector } from './block-render.js';
export type { RenderBlockOptions, BlockRenderResult } from './block-render.js';

export {
  findInlineOonMatches,
  isOonCodeLanguage,
  looksLikeOonBlock,
  INLINE_OON_PREFIX,
} from './dsl-detector.js';
export type { InlineMatch } from './dsl-detector.js';

export { OonPluginError, OonRenderError } from './errors.js';
