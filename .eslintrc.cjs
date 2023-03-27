// eslint-disable-next-line import/no-unassigned-import
require('@rushstack/eslint-patch/modern-module-resolution')

const generalJS = {
  'linebreak-style': ['off'],
  '@babel/no-invalid-this': ['off'],
  'canonical/id-match': ['off'],
  'object-curly-newline': [
    'error',
    {
      consistent: true,
    },
  ],
  semi: ['error', 'never'],
  'canonical/sort-keys': ['off'],
  'array-bracket-newline': [
    'error',
    {
      minItems: 4,
      multiline: true,
    },
  ],
  'array-element-newline': [
    'error',
    {
      minItems: 4,
      multiline: true,
    },
  ],
  'canonical/destructuring-property-newline': ['off'],
  '@babel/semi': ['error', 'never'],
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
}

const ts = {
  '@typescript-eslint/naming-convention': ['warn'],
  '@typescript-eslint/semi': ['error', 'never'],
  'typescript-sort-keys/interface': 'off',
  // '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
  'canonical/import-specifier-newline': 'off',
  'canonical/prefer-inline-type-import': 'off',
  '@typescript-eslint/no-extra-parens': 'off',
  '@typescript-eslint/member-delimiter-style': [
    'error',
    {
      singleline: {
        delimiter: 'comma',
        requireLast: false,
      },
    },
  ],
}

module.exports = {
  root: true,
  extends: [
    'canonical',
  ],
  rules: generalJS,
  ignorePatterns: ['*.cjs', '*.config.mjs', '**/node_modules/**'],
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  overrides: [
    {
      extends: ['canonical/typescript'],
      files: ['*.ts'],
      parserOptions: {
        project: './tsconfig.json',
      },
      rules: {
        ...generalJS,
        ...ts,
      },
    },
    {
      files: ['*.svelte'],
      processor: 'svelte3/svelte3',
      extends: ['canonical/typescript'],
      plugins: ['canonical', 'svelte3', '@typescript-eslint'],
      parserOptions: {
        parser: '@typescript-eslint/parser',
        project: './tsconfig.json',
        extraFileExtensions: ['.svelte'],
      },
      rules: {
        ...generalJS,
        ...ts,
        'no-multiple-empty-lines': 0,
        'import/first': 'off',
        'import/no-duplicates': 'off',
        'import/no-mutable-exports': 'off',
        'import/no-unresolved': 'off',
        'import/prefer-default-export': 'off',
        'import/extensions': [2, 'never', {
          'svg': 'always',
          'svelte': 'always'
        }],
      },
    },
    {
      extends: ['canonical/json'],
      files: '*.json',
    },
    {
      extends: ['canonical/yaml'],
      files: '*.yaml',
    },
  ],
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2020
  },
  settings: {
    'svelte3/typescript': () => require('typescript'),
  },
}
