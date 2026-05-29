export class OoonPluginError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'OoonPluginError';
  }
}

export class OoonRenderError extends OoonPluginError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'OoonRenderError';
  }
}
