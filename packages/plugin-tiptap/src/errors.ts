export class OonPluginError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'OonPluginError';
  }
}

export class OonRenderError extends OonPluginError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'OonRenderError';
  }
}
