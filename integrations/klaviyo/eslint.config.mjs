import tseslint from 'typescript-eslint';
import unusedImports from 'eslint-plugin-unused-imports';

export default [
  ...tseslint.configs.recommended,
  {
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      // Unused imports
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      // Basic code quality
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-unused-vars': 'off', // handled by unused-imports plugin

      // TypeScript specific
      '@typescript-eslint/no-explicit-any': 'warn',
      'prefer-const': 'error',
    },
  },
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/.botpress/**', '**/build/**', '**/*.js', '**/*.cjs', '**/*.mjs'],
  }
];
