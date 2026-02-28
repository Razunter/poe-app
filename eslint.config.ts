import e18e from '@e18e/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import auto from "eslint-config-canonical/auto"
import { recommended as canonical } from "eslint-config-canonical/canonical";
import { recommended as canonicalJSDoc } from "eslint-config-canonical/jsdoc";
import { recommended as canonicalPrettier } from "eslint-config-canonical/prettier";
import { recommended as canonicalRegexp } from "eslint-config-canonical/regexp";
import { recommended as canonicalTS } from "eslint-config-canonical/typescript";
import { recommended as canonicalTSTC } from "eslint-config-canonical/typescript-type-checking";
import * as depend from 'eslint-plugin-depend'
import eslintPluginSvelte from 'eslint-plugin-svelte'
import globals from 'globals'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const newPrettierConfig = canonicalPrettier[0].rules["prettier/prettier"][1];
newPrettierConfig.semi = false;
newPrettierConfig.printWidth = 120;
newPrettierConfig.jsxSingleQuote = false;
newPrettierConfig.singleAttributePerLine = false;

const generalJS = {
  "@stylistic/semi": [2, "never"],
  "canonical/destructuring-property-newline": ["off"],
  "canonical/id-match": ["off"],
  "canonical/sort-keys": ["off"],
  "canonical/filename-match-regex": ["off"],
  "comma-dangle": [
    "error",
    {
      arrays: "always-multiline",
      exports: "always-multiline",
      functions: "always-multiline",
      imports: "always-multiline",
      objects: "always-multiline",
    },
  ],
  "import/no-unassigned-import": [
    2,
    { allow: ["**/*.css", "**/*.scss", "**/*.postcss"] },
  ],
  "linebreak-style": ["off"],
  "object-curly-newline": [
    "error",
    {
      consistent: true,
    },
  ],
  "prettier/prettier": [2, newPrettierConfig],
  "import/extensions": [
    2,
    "never",
    {
      ignorePackages: true,
      pattern: {
        js: "always",
        jsx: "always",
        ts: "always",
        tsx: "always",
        svelte: "always",
        svg: "always",
        graphql: "always",
        json: "always",
        css: "always",
        scss: "always",
        webp: "always",
      },
    },
  ],
  "perfectionist/sort-objects": "off",
  "perfectionist/sort-object-types": "off",
  "perfectionist/sort-intersection-types": "off",
  "perfectionist/sort-maps": "off",
};

const ts = {
  "@typescript-eslint/naming-convention": ["warn"],
  "@typescript-eslint/no-extra-parens": "off",
  // '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
  "canonical/import-specifier-newline": "off",
  "canonical/prefer-inline-type-import": "off",
  "typescript-sort-keys/interface": "off",
  "import/consistent-type-specifier-style": "off", // not granular enough
  "import/no-duplicates": "warn",
  "perfectionist/sort-interfaces": "off",
  // Incompatible rules
  "@typescript-eslint/dot-notation": "off",
};

const canonicalStrictTSRules = canonicalTSTC[0].rules;
delete canonicalStrictTSRules["@typescript-eslint/no-throw-literal"];

export default [
  ...auto,
  ...eslintPluginSvelte.configs["flat/recommended"],
  depend.configs["flat/recommended"],
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  e18e.configs!.recommended,
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
    ],
  },
  {
    files: [
      "**/*.svelte",
      "*.svelte",
      // Need to specify the file extension for Svelte 5 with rune symbols
      "**/*.svelte.js",
      "*.svelte.js",
      "**/*.svelte.ts",
      "*.svelte.ts",
    ],
    plugins: {
      ...canonical[0].plugins,
      ...canonicalTS[0].plugins,
      ...canonicalTSTC[0].plugins,
      ...canonicalRegexp[0].plugins,
      ...canonicalPrettier[0].plugins,
      ...canonicalJSDoc[0].plugins,
    },
    rules: {
      ...canonical[0].rules,
      ...canonicalTS[0].rules,
      ...canonicalStrictTSRules,
      ...canonicalRegexp[0].rules,
      ...canonicalPrettier[0].rules,
      ...canonicalJSDoc[0].rules,
      ...generalJS,
      ...ts,
      // 'import/first': 'off',
      // 'import/no-duplicates': 'off',
      "import/no-mutable-exports": "off",
      // 'import/no-unresolved': 'off',
      // 'import/prefer-default-export': 'off',
      "no-multiple-empty-lines": 0,
      "@typescript-eslint/no-unused-vars": "off", // Breaks Svelte Stores
      "no-self-assign": "off", // Triggers Svelte variable update
      "no-undef-init": "off", // Marks variable as optional for components
      "canonical/filename-match-regex": "off",
      "svelte/no-at-html-tags": "off",
      "svelte/prefer-const": "error",
      "prefer-const": "off", // svelte eslint plugin has its own rule ↑
      "prettier/prettier": [
        2,
        {
          ...newPrettierConfig,
          plugins: ["prettier-plugin-svelte"],
          parser: "svelte",
          svelteSortOrder: "scripts-markup-styles-options",
        },
      ],
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
        parser: tsParser,
        extraFileExtensions: [".svelte"],
      },
    },
  },
  {
    files: ["**/*.js"],
    rules: {
      ...generalJS,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      ...generalJS,
      ...ts,
    },
  },
];
