import { BRAVURA_FONT_FAMILY } from '@ooon/core';

export interface LoadBravuraOptions {
  url: string;
  family?: string;
  descriptors?: FontFaceDescriptors;
}

export class FontLoadError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'FontLoadError';
  }
}

let bravuraPromise: Promise<FontFace> | undefined;

export async function loadBravura(opts: LoadBravuraOptions): Promise<FontFace> {
  if (bravuraPromise) return bravuraPromise;
  const family = opts.family ?? BRAVURA_FONT_FAMILY;
  if (typeof document === 'undefined' || typeof FontFace === 'undefined') {
    throw new FontLoadError('loadBravura: FontFace API not available in this environment');
  }
  const src = `url(${JSON.stringify(opts.url)}) format('woff2')`;
  const face = new FontFace(family, src, opts.descriptors);
  bravuraPromise = face
    .load()
    .then((loaded) => {
      document.fonts.add(loaded);
      return loaded;
    })
    .catch((err: unknown) => {
      bravuraPromise = undefined;
      throw new FontLoadError(`Failed to load Bravura font from ${opts.url}`, { cause: err });
    });
  return bravuraPromise;
}

export function isBravuraLoaded(family: string = BRAVURA_FONT_FAMILY): boolean {
  if (typeof document === 'undefined') return false;
  return document.fonts.check(`12px "${family}"`);
}

export function resetBravuraLoader(): void {
  bravuraPromise = undefined;
}
