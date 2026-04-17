import type { CanvasProjector } from '@oon/projector-web';
import { parseInline, pitchToMidi } from '@oon/core';
import { calculateKeyboardLayout } from '@oon/core';
import { renderChord, renderNote, renderScale } from '@oon/projector-web';
import type { OonRuntime } from './runtime.js';

export interface InlinePopoverHandle {
  dom: HTMLElement;
  destroy: () => void;
}

export interface OpenInlinePopoverOptions {
  runtime: OonRuntime;
  source: string;
  anchor: DOMRect;
  container?: HTMLElement;
  width?: number;
}

export function openInlinePopover(opts: OpenInlinePopoverOptions): InlinePopoverHandle {
  const container = opts.container ?? document.body;
  const dom = document.createElement('div');
  dom.className = 'oon-inline-popover';
  dom.style.position = 'absolute';
  dom.style.left = `${opts.anchor.left + window.scrollX}px`;
  dom.style.top = `${opts.anchor.bottom + window.scrollY + 4}px`;
  dom.style.zIndex = '1000';
  dom.style.background = '#ffffff';
  dom.style.border = '1px solid #d1d5db';
  dom.style.borderRadius = '6px';
  dom.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
  dom.style.padding = '12px';

  const canvas = document.createElement('canvas');
  dom.appendChild(canvas);
  container.appendChild(dom);

  const projector: CanvasProjector = opts.runtime.createProjector(canvas);
  const width = opts.width ?? 360;

  const node = parseInline(opts.source);

  if (node.type === 'note') {
    projector.resize(width, 80);
    projector.clear();
    renderNote(projector, node, { originX: 12, originY: 12 });
  } else if (node.type === 'chord') {
    const layout = calculateKeyboardLayout({
      highlighted: new Set(
        node.notes
          .map((p) => {
            try {
              return pitchToMidi(p);
            } catch {
              return -1;
            }
          })
          .filter((m) => m > 0),
      ),
      showLabels: false,
    });
    const h = 28 + layout.height + 24;
    projector.resize(Math.max(width, layout.width + 24), h);
    projector.clear();
    renderChord(projector, node, { originX: 12, originY: 12 });
  } else if (node.type === 'scale') {
    projector.resize(width + 60, 160);
    projector.clear();
    renderScale(projector, node, { originX: 12, originY: 12 });
  }

  return {
    dom,
    destroy(): void {
      opts.runtime.releaseProjector(projector);
      if (dom.parentElement) dom.parentElement.removeChild(dom);
    },
  };
}
