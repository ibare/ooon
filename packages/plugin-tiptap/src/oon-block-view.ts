import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import type { CanvasProjector } from '@oon/projector-web';
import { renderBlockToProjector } from './block-render.js';
import type { OonRuntime } from './runtime.js';

export interface OonBlockViewOptions {
  runtime: OonRuntime;
  showNoteNames?: boolean;
  defaultWidth?: number;
}

export interface OonBlockViewHandle {
  dom: HTMLElement;
  update: (source: string) => void;
  destroy: () => void;
}

export function createOonBlockView(
  node: ProseMirrorNode,
  opts: OonBlockViewOptions,
): OonBlockViewHandle {
  const dom = document.createElement('div');
  dom.className = 'oon-block';

  const canvas = document.createElement('canvas');
  dom.appendChild(canvas);

  const details = document.createElement('details');
  details.className = 'oon-block-source';
  const summary = document.createElement('summary');
  summary.textContent = 'DSL 원문';
  details.appendChild(summary);
  const pre = document.createElement('pre');
  pre.className = 'oon-block-source-pre';
  details.appendChild(pre);
  dom.appendChild(details);

  const warnings = document.createElement('div');
  warnings.className = 'oon-block-warnings';
  dom.appendChild(warnings);

  const width = opts.defaultWidth ?? 600;
  const projector: CanvasProjector = opts.runtime.createProjector(canvas);
  projector.resize(width, 200);

  function render(source: string): void {
    pre.textContent = source;
    warnings.textContent = '';
    try {
      const result = renderBlockToProjector(projector, source, {
        width,
        ...(opts.showNoteNames !== undefined ? { showNoteNames: opts.showNoteNames } : {}),
      });
      projector.resize(width, Math.max(result.height + 40, 80));
      renderBlockToProjector(projector, source, {
        width,
        ...(opts.showNoteNames !== undefined ? { showNoteNames: opts.showNoteNames } : {}),
      });
      if (result.warnings.length > 0) {
        warnings.textContent = result.warnings.join(' · ');
      }
    } catch (err) {
      warnings.textContent = (err as Error).message;
    }
  }

  render(node.textContent);

  return {
    dom,
    update(source: string): void {
      render(source);
    },
    destroy(): void {
      opts.runtime.releaseProjector(projector);
    },
  };
}
