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
}

const ts = {
  '@typescript-eslint/naming-convention': ['warn'],
  '@typescript-eslint/semi': ['error', 'never'],
  'typescript-sort-keys/interface': 'off',
  '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
  'canonical/import-specifier-newline': 'off',
  '@typescript-eslint/no-extra-parens': 'off',
}

module.exports = {
  extends: [
    'plugin:vue/recommended',
    '@nuxtjs',
    'plugin:nuxt/recommended',
    'canonical',
  ],
  overrides: [
    {
      extends: ['canonical/typescript'],
      files: ['*.ts', '*.vue'],
      parserOptions: {
        project: './tsconfig.json',
      },
      rules: {
        ...generalJS,
        ...ts,
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
