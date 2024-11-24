import tsParser from '@typescript-eslint/parser'
import auto from 'eslint-config-canonical/configurations/auto.js'
import canonical from 'eslint-config-canonical/configurations/canonical.js'
import canonicalJSDoc from 'eslint-config-canonical/configurations/jsdoc.js'
import canonicalPrettier from 'eslint-config-canonical/configurations/prettier.js'
import canonicalRegexp from 'eslint-config-canonical/configurations/regexp.js'
import canonicalTSTC from 'eslint-config-canonical/configurations/typescript-type-checking.js'
import canonicalTS from 'eslint-config-canonical/configurations/typescript.js'
import * as depend from 'eslint-plugin-depend'
import eslintPluginSvelte from 'eslint-plugin-svelte'
import globals from 'globals'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import svelteParser from 'svelte-eslint-parser'

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const newPrettierConfig = canonicalPrettier.recommended.rules['prettier/prettier'][1]
newPrettierConfig.semi = false
newPrettierConfig.printWidth = 120
newPrettierConfig.jsxSingleQuote = false
newPrettierConfig.singleAttributePerLine = false

const generalJS = {
  '@stylistic/semi': [2, 'never'],
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
  'perfectionist/sort-objects': 'off',
  'perfectionist/sort-object-types': 'off',
  'perfectionist/sort-intersection-types': 'off',
}

const ts = {
  '@typescript-eslint/naming-convention': ['warn'],
  '@typescript-eslint/no-extra-parens': 'off',
  // '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
  'canonical/import-specifier-newline': 'off',
  'canonical/prefer-inline-type-import': 'off',
  'typescript-sort-keys/interface': 'off',
  'import/consistent-type-specifier-style': 'off', // not granular enough
  'import/no-duplicates': 'warn',
  // Incompatible rules
  '@typescript-eslint/dot-notation': 'off',
}

const canonicalStrictTSRules = canonicalTSTC.recommended.rules
delete canonicalStrictTSRules['@typescript-eslint/no-throw-literal']

const parserOptions = {
  ecmaVersion: 'latest',
  sourceType: 'module',
  project: './tsconfig.json',
  tsconfigRootDir: __dirname,
  extraFileExtensions: ['.svelte'],
  parser: tsParser,
}

export default [
  ...auto,
  ...eslintPluginSvelte.configs['flat/recommended'],
  depend.configs['flat/recommended'],
  {
    files: ['**/*.svelte'],
    plugins: {
      ...canonical.recommended.plugins,
      ...canonicalTS.recommended.plugins,
      ...canonicalTSTC.recommended.plugins,
      ...canonicalRegexp.recommended.plugins,
      ...canonicalPrettier.recommended.plugins,
      ...canonicalJSDoc.recommended.plugins,
    },
    rules: {
      ...canonical.recommended.rules,
      ...canonicalTS.recommended.rules,
      ...canonicalStrictTSRules,
      ...canonicalRegexp.recommended.rules,
      ...canonicalPrettier.recommended.rules,
      ...canonicalJSDoc.recommended.rules,
      ...generalJS,
      ...ts,
      // 'import/first': 'off',
      // 'import/no-duplicates': 'off',
      'import/no-mutable-exports': 'off',
      // 'import/no-unresolved': 'off',
      // 'import/prefer-default-export': 'off',
      'no-multiple-empty-lines': 0,
      '@typescript-eslint/no-unused-vars': 'off', // Breaks Svelte Stores
      'no-self-assign': 'off', // Triggers Svelte variable update
      'no-undef-init': 'off', // Marks variable as optional for components
      'canonical/filename-match-regex': 'off',
      'svelte/no-at-html-tags': 'off',
      'prefer-const': 'warn',
      'prettier/prettier': [
        2,
        {
          ...newPrettierConfig,
          plugins: ['prettier-plugin-svelte'],
          parser: 'svelte',
          svelteSortOrder: 'scripts-markup-styles-options',
        },
      ],
      'perfectionist/sort-svelte-attributes': 'off', // иначе возникают проблемы с валидацией TS
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parser: svelteParser,
      parserOptions,
    },
  },
  {
    files: ['**/*.js'],
    rules: {
      ...generalJS,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions,
    },
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions,
    },
    rules: {
      ...generalJS,
      ...ts,
    },
  },
]
