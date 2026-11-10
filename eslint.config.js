import js from '@eslint/js';

// NOTE: TypeScript source cannot be linted yet because typescript-eslint
// (parser + plugins) does not support TypeScript 7. Type safety is enforced
// by `npm run typecheck` (tsc --noEmit). Revisit when typescript-eslint
// ships TS 7 support: https://github.com/typescript-eslint/typescript-eslint/issues/10940
export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  {
    files: ['**/*.js'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
      },
    },
    rules: {
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
];
