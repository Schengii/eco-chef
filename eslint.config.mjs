import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      'dist/**',
      'www/**',
      'platforms/**',
      'plugins/**',
      'node_modules/**',
      'test-results/**',
      'playwright-report/**',
      'coverage/**',
      '*.config.js',
      '.githooks/**',
      'ui-src/sw.js'
    ],
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'no-control-regex': 'off',
    },
  }
);
