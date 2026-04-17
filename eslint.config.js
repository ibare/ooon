import oonConfig from '@oon/eslint-config';

export default [
  ...oonConfig,
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/.turbo/**', '**/coverage/**'],
  },
];
