import oonConfig from '@ooon/eslint-config';

export default [
  ...oonConfig,
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/.turbo/**', '**/coverage/**'],
  },
];
