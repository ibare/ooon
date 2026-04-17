import type { Projector } from '@oon/shared';
import type { KeyboardLayout } from '@oon/core';
import { FONT, METRICS, THEME } from '../theme.js';

export interface KeyboardRenderOptions {
  originX?: number;
  originY?: number;
  showLabels?: boolean;
}

export function renderKeyboard(
  projector: Projector,
  layout: KeyboardLayout,
  opts: KeyboardRenderOptions = {},
): void {
  const ox = opts.originX ?? 0;
  const oy = opts.originY ?? 0;
  const showLabels = opts.showLabels ?? false;

  projector.save();
  projector.translate(ox, oy);

  for (const key of layout.keys) {
    if (key.isBlack) continue;
    const fill = key.highlighted ? THEME.accentSoft : THEME.whiteKey;
    projector.drawRect(key.rect, fill, THEME.whiteKeyStroke, METRICS.stroke);
    if (showLabels && key.label) {
      projector.drawText(
        key.label,
        { x: key.rect.x + key.rect.width / 2, y: key.rect.y + key.rect.height - 10 },
        { font: FONT.ui, fontSize: 10, fill: THEME.keyLabel, align: 'center', baseline: 'bottom' },
      );
    }
    projector.registerHitArea(`key:${key.midi}`, key.rect, 'pointer');
  }

  for (const key of layout.keys) {
    if (!key.isBlack) continue;
    const fill = key.highlighted ? THEME.highlight : THEME.blackKey;
    projector.drawRect(key.rect, fill, THEME.whiteKeyStroke, METRICS.stroke);
    if (showLabels && key.label) {
      projector.drawText(
        key.label,
        { x: key.rect.x + key.rect.width / 2, y: key.rect.y + key.rect.height - 6 },
        { font: FONT.ui, fontSize: 9, fill: THEME.whiteKey, align: 'center', baseline: 'bottom' },
      );
    }
    projector.registerHitArea(`key:${key.midi}`, key.rect, 'pointer');
  }

  projector.restore();
}
