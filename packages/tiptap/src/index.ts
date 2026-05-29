export { OoonRuntime } from './runtime.js';
export type { OoonRuntimeOptions } from './runtime.js';

export { OoonBlock } from './ooon-block.js';
export type { OoonBlockOptions } from './ooon-block.js';

export { createOoonBlockView } from './ooon-block-view.js';
export type { OoonBlockViewOptions, OoonBlockViewHandle } from './ooon-block-view.js';

export { OoonInline } from './ooon-inline-extension.js';
export type { OoonInlineExtensionOptions } from './ooon-inline-extension.js';

export { createOoonInlinePlugin, ooonInlinePluginKey } from './ooon-inline.js';
export type { OoonInlinePluginOptions } from './ooon-inline.js';

export { openInlinePopover } from './inline-popover.js';
export type { InlinePopoverHandle, OpenInlinePopoverOptions } from './inline-popover.js';

export { renderBlockToProjector } from './block-render.js';
export type { RenderBlockOptions, BlockRenderResult } from './block-render.js';

export {
  findInlineOoonMatches,
  isOoonCodeLanguage,
  looksLikeOoonBlock,
  INLINE_OOON_PREFIX,
} from './dsl-detector.js';
export type { InlineMatch } from './dsl-detector.js';

export {
  OOON_NODE_NAME,
  OOON_FENCE_LANG,
  OOON_FENCE_RE,
  ooonNodeToMarkdown,
  createOoonNodeFromSource,
} from './markdown-fence.js';

export { OoonPluginError, OoonRenderError } from './errors.js';
