import { FlatCompat } from '@eslint/eslintrc'
import prettierConfig from 'eslint-config-canonical/configurations/prettier.js'
import globals from 'globals'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const newPrettierConfig = prettierConfig.rules['prettier/prettier'][1]
newPrettierConfig.semi = false
newPrettierConfig.printWidth = 120

const generalJS = {
  '@babel/no-invalid-this': ['off'],
  '@babel/semi': ['error', 'never'],
  semi: ['error', 'never'],
  'canonical/destructuring-property-newline': ['off'],
  'canonical/id-match': ['off'],
  'canonical/sort-keys': ['off'],
  'comma-dangle': [
    'error',
    {
      arrays: 'always-multiline',
      exports: 'always-multiline',
      functions: 'always-multiline',
      imports: 'always-multiline',
      objects: 'always-multiline',
    },
  ],
  'import/no-unassigned-import': [2, { allow: ['**/*.css', '**/*.scss', '**/*.postcss'] }],
  'linebreak-style': ['off'],
  'object-curly-newline': [
    'error',
    {
      consistent: true,
    },
  ],
  'prettier/prettier': [2, newPrettierConfig],
  'import/extensions': [
    2,
    'never',
    {
      ignorePackages: true,
      pattern: {
        js: 'always',
        jsx: 'always',
        ts: 'always',
        tsx: 'always',
        svelte: 'always',
        svg: 'always',
        graphql: 'always',
        json: 'always',
        css: 'always',
        scss: 'always',
      },
    },
  ],
}

const ts = {
  '@typescript-eslint/naming-convention': ['warn'],
  '@typescript-eslint/no-extra-parens': 'off',
  '@typescript-eslint/semi': ['error', 'never'],
  '@typescript-eslint/space-before-function-paren': [
    'error',
    {
      anonymous: 'always',
      asyncArrow: 'always',
      named: 'never',
    },
  ],
  // '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
  'canonical/import-specifier-newline': 'off',
  'canonical/prefer-inline-type-import': 'off',
  'typescript-sort-keys/interface': 'off',
}

export default [
  // mimic ESLintRC-style extends
  ...compat.extends('canonical/auto'),
  ...compat.config({
    extends: 'plugin:svelte/recommended',
    parser: '@typescript-eslint/parser',
    parserOptions: {
      project: './tsconfig.json',
      tsconfigRootDir: __dirname,
      extraFileExtensions: ['.svelte'],
    },
    overrides: [
      {
        files: ['**/*.svelte'],
        plugins: ['prettier'],
        extends: [
          'canonical',
          'canonical/regexp',
          'canonical/jsdoc',
          'canonical/node',
          'canonical/typescript',
          'canonical/prettier',
        ],
        parser: 'svelte-eslint-parser',
        parserOptions: {
          parser: '@typescript-eslint/parser',
          project: './tsconfig.json',
          tsconfigRootDir: __dirname,
        },
        rules: {
          ...generalJS,
          ...ts,
          'import/first': 'off',
          'import/no-duplicates': 'off',
          'import/no-mutable-exports': 'off',
          'import/no-unresolved': 'off',
          'import/prefer-default-export': 'off',
          'no-multiple-empty-lines': 0,
          '@typescript-eslint/no-unused-vars': 'off', // Breaks Svelte Stores
          'no-self-assign': 'off', // Triggers Svelte variable update
          'no-undef-init': 'off', // Marks variable as optional for components
          'canonical/filename-match-regex': 'off',
          'svelte/no-at-html-tags': 'off',
          'prettier/prettier': [
            2,
            {
              ...newPrettierConfig,
              plugins: ['prettier-plugin-svelte'],
              parser: 'svelte',
            },
          ],
        },
      },
    ],
  }),
  {
    files: ['**/*.js'],
    rules: {
      ...generalJS,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        // eslint-disable-next-line unicorn/numeric-separators-style
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        // eslint-disable-next-line unicorn/numeric-separators-style
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      ...generalJS,
      ...ts,
    },
  },
]
