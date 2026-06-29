import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import-x';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['packages/database/src/generated/**'],
  },
  js.configs.recommended,
  prettier,

  {
    files: ['**/*.js'],
    ignores: ['node_modules/**'],

    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      }, 
    },

    plugins: {
      'import-x': importPlugin,
    },

    settings: {
      'import-x/resolver': {
        node: true,
      },
    },

    rules: {
      'no-undef': 'error',
      'import-x/no-unresolved': 'error',
      'no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      'no-console': 'off',
    },
  },
];
