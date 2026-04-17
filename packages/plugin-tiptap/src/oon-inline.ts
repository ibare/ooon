import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { EditorView } from '@tiptap/pm/view';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { findInlineOonMatches } from './dsl-detector.js';
import { openInlinePopover, type InlinePopoverHandle } from './inline-popover.js';
import type { OonRuntime } from './runtime.js';

export interface OonInlinePluginOptions {
  runtime: OonRuntime;
  className?: string;
  container?: HTMLElement;
}

export const oonInlinePluginKey = new PluginKey<DecorationSet>('oon-inline');

export function createOonInlinePlugin(opts: OonInlinePluginOptions): Plugin<DecorationSet> {
  const className = opts.className ?? 'oon-inline';

  return new Plugin<DecorationSet>({
    key: oonInlinePluginKey,
    state: {
      init: (_config, state) => buildDecorations(state.doc, className),
      apply: (tr, oldSet) => {
        if (!tr.docChanged) return oldSet;
        return buildDecorations(tr.doc, className);
      },
    },
    props: {
      decorations(state) {
        return oonInlinePluginKey.getState(state) ?? DecorationSet.empty;
      },
      handleClick(view, _pos, event) {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return false;
        if (!target.classList.contains(className)) return false;
        const src = target.getAttribute('data-oon-source');
        if (!src) return false;
        showPopoverForInline(view, target, src, opts);
        event.preventDefault();
        return true;
      },
    },
  });
}

function buildDecorations(doc: ProseMirrorNode, className: string): DecorationSet {
  const decos: Decoration[] = [];
  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    const matches = findInlineOonMatches(node.text);
    for (const m of matches) {
      decos.push(
        Decoration.inline(pos + m.start, pos + m.end, {
          class: className,
          'data-oon-source': m.source,
          style: 'cursor: pointer;',
        }),
      );
    }
  });
  return DecorationSet.create(doc, decos);
}

let activePopover: InlinePopoverHandle | undefined;

function showPopoverForInline(
  view: EditorView,
  target: HTMLElement,
  source: string,
  opts: OonInlinePluginOptions,
): void {
  activePopover?.destroy();
  const rect = target.getBoundingClientRect();
  const handle = openInlinePopover({
    runtime: opts.runtime,
    source,
    anchor: rect,
    ...(opts.container ? { container: opts.container } : {}),
  });
  activePopover = handle;

  const dismiss = (ev: MouseEvent): void => {
    if (handle.dom.contains(ev.target as Node)) return;
    if (target.contains(ev.target as Node)) return;
    handle.destroy();
    if (activePopover === handle) activePopover = undefined;
    document.removeEventListener('mousedown', dismiss, true);
  };
  setTimeout(() => document.addEventListener('mousedown', dismiss, true), 0);
  void view;
}
