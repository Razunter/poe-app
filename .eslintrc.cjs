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
  extends: ['canonical'],
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
      files: ['*.vue'],
      extends: [
        'canonical/typescript',
        'plugin:vue/recommended',
        '@vue/eslint-config-typescript/recommended',
      ],
      parser: 'vue-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
        project: './tsconfig.json',
        sourceType: 'module',
        tsconfigRootDir: './',
      },
      rules: {
        ...generalJS,
        ...ts,
        'vue/multi-word-component-names': 'off',
        'import/extensions': ['error', 'never', { 'vue': 'always' }],
        'vue/no-multiple-template-root': 'off',
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
  root: true,
  rules: generalJS,
}
