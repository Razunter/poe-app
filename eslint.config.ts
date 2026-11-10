import e18e from '@e18e/eslint-plugin'
import { fixupPluginRules } from '@eslint/compat'
import tsParser from '@typescript-eslint/parser'
import auto from 'eslint-config-canonical/auto'
import { recommended as canonical } from 'eslint-config-canonical/canonical'
import { recommended as canonicalJSDocument } from 'eslint-config-canonical/jsdoc'
import { recommended as canonicalPrettier } from 'eslint-config-canonical/prettier'
import { recommended as canonicalRegexp } from 'eslint-config-canonical/regexp'
import { recommended as canonicalTS } from 'eslint-config-canonical/typescript'
import { recommended as canonicalTSTC } from 'eslint-config-canonical/typescript-type-checking'
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript'
import * as depend from 'eslint-plugin-depend'
import { createNodeResolver } from 'eslint-plugin-import-x'
import eslintPluginSvelte from 'eslint-plugin-svelte'
import globals from 'globals'

const newPrettierConfig = (canonicalPrettier[0].rules?.['prettier/prettier'] as [number, Record<string, unknown>])[1]
newPrettierConfig.semi = false
newPrettierConfig.printWidth = 120
newPrettierConfig.jsxSingleQuote = false
newPrettierConfig.singleAttributePerLine = false

const generalJS = {
  '@stylistic/semi': [2, 'never'],
  'canonical/destructuring-property-newline': ['off'],
  'canonical/id-match': ['off'],
  'canonical/sort-keys': ['off'],
  'canonical/filename-match-regex': ['off'],
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
  'import/no-unassigned-import': [2, { allow: ['**/*.css', '**/*.postcss'] }],
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
        webp: 'always',
      },
    },
  ],
  'perfectionist/sort-modules': 'off',
  'perfectionist/sort-objects': 'off',
  'perfectionist/sort-object-types': 'off',
  'perfectionist/sort-intersection-types': 'off',
  'perfectionist/sort-maps': 'off',
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
  'perfectionist/sort-interfaces': 'off',
  // Incompatible rules
  '@typescript-eslint/dot-notation': 'off',
}

const canonicalStrictTSRules = { ...canonicalTSTC[0].rules }
delete canonicalStrictTSRules['@typescript-eslint/no-throw-literal']

export default [
  ...auto,
  ...eslintPluginSvelte.configs['flat/recommended'],
  depend.configs['flat/recommended'],
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  e18e.configs!.recommended,
  {
    languageOptions: {
      parserOptions: {
        extraFileExtensions: ['.svelte'],
      },
    },
    settings: {
      'import-x/resolver-next': [createTypeScriptImportResolver({ extensions: ['.ts', '.tsx'] }), createNodeResolver()],
    },
  },
  {
    // Note: there should be no other properties in this object
    ignores: [
      '*.cjs',
      '*.config.mjs',
      '**/node_modules/**',
      '*.scss',
      'build',
      '.idea',
      '.svelte-kit',
      '.beads',
      '.opencode',
      '.codegraph',
      'playwright-report',
      'test-results',
    ],
  },
  {
    files: [
      '**/*.svelte',
      '*.svelte',
      // Need to specify the file extension for Svelte 5 with rune symbols
      '**/*.svelte.js',
      '*.svelte.js',
      '**/*.svelte.ts',
      '*.svelte.ts',
    ],
    plugins: {
      ...canonical[0].plugins,
      ...canonicalTS[0].plugins,
      ...canonicalTSTC[0].plugins,
      ...canonicalRegexp[0].plugins,
      ...canonicalPrettier[0].plugins,
      ...canonicalJSDocument[0].plugins,
    },
    rules: {
      ...canonical[0].rules,
      ...canonicalTS[0].rules,
      ...canonicalStrictTSRules,
      ...canonicalRegexp[0].rules,
      ...canonicalPrettier[0].rules,
      ...canonicalJSDocument[0].rules,
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
      'svelte/prefer-const': 'error',
      'prefer-const': 'off', // svelte eslint plugin has its own rule ↑
      'prettier/prettier': [
        2,
        {
          ...newPrettierConfig,
          plugins: ['prettier-plugin-svelte'],
          parser: 'svelte',
          svelteSortOrder: 'scripts-markup-styles-options',
        },
      ],
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        parser: tsParser,
      },
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
      parserOptions: {
        ecmaVersion: 'latest',
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
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...generalJS,
      ...ts,
    },
  },
  {
    files: ['src/lib/components/ui/button/button.svelte'],
    rules: {
      // Link destinations are resolved by callers, not by the generic HTML button primitive.
      'svelte/no-navigation-without-resolve': ['error', { ignoreLinks: true }],
    },
  },
  {
    files: ['src/env.ts', 'src/lib/utils.ts'],
    rules: {
      'unicorn/prevent-abbreviations': [
        2,
        {
          ...(canonical[0].rules?.['unicorn/prevent-abbreviations'] as [number, Record<string, unknown>])[1],
          allowList: { env: true, utils: true },
        },
      ],
    },
  },
].map((config) => {
  if (!config.plugins) {
    return config
  }

  const plugins = { ...config.plugins }
  // Only legacy JavaScript plugins need the removed rule API methods.
  for (const name of ['eslint-comments', 'jsdoc', 'react']) {
    if (plugins[name]) {
      plugins[name] = fixupPluginRules(plugins[name])
    }
  }

  return { ...config, plugins }
})
