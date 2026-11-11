import { expect, test } from '@playwright/test'
import { ESLint, Linter } from 'eslint'
import path from 'node:path'

const mergedImport = /^import \{\s*get\s*,\s*writable\s*\} from 'svelte\/store'$/u

test('duplicate-import autofix preserves runtime subpaths and still merges actual duplicates', async () => {
  const filename = path.resolve('src/lib/BuildsProcessing/updateBuilds.svelte.ts')
  const config = (await new ESLint().calculateConfigForFile(filename)) as Linter.Config
  if (!config.plugins?.import || !config.rules?.['import/no-duplicates']) {
    throw new Error('Expected the project duplicate-import rule')
  }

  const linter = new Linter()
  const ruleConfig = {
    files: ['**/*.ts'],
    plugins: { import: config.plugins.import },
    settings: config.settings,
    rules: { 'import/no-duplicates': config.rules['import/no-duplicates'] },
  }
  const distinct = "import { SvelteDate } from 'svelte/reactivity'\nimport { get } from 'svelte/store'\n"
  const preserved = linter.verifyAndFix(distinct, ruleConfig, { filename })
  expect(preserved.messages).toEqual([])
  expect(preserved.output).toBe(distinct)

  const merged = linter.verifyAndFix(
    "import { get } from 'svelte/store'\nimport { writable } from 'svelte/store'\n",
    ruleConfig,
    { filename },
  )
  expect(merged.messages).toEqual([])
  expect(merged.output.trim()).toMatch(mergedImport)
})
