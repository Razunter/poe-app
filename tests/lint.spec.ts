import { expect, test } from '@playwright/test'
import { ESLint, Linter } from 'eslint'
import { execFileSync, spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
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

test('commit checks lint staged contents without reading unstaged edits', () => {
  const root = process.cwd()
  const directory = mkdtempSync(path.join(tmpdir(), 'poe-commit-lint-'))
  const file = path.join(directory, 'src/file with spaces.js')
  const git = (...args: string[]) => execFileSync('git', args, { cwd: directory, encoding: 'utf8' })
  const check = () => spawnSync('bun', [path.join(root, 'verifyCommit.js')], { cwd: directory, encoding: 'utf8' })

  try {
    git('init', '-q')
    copyFileSync(path.join(root, '.gitignore'), path.join(directory, '.gitignore'))
    copyFileSync(path.join(root, 'eslint.config.ts'), path.join(directory, 'eslint.config.ts'))
    symlinkSync(path.join(root, 'node_modules'), path.join(directory, 'node_modules'), 'dir')
    mkdirSync(path.dirname(file))
    writeFileSync(file, 'export const value =\n')
    git('add', 'src')
    writeFileSync(file, 'export const value = 1\n')
    const invalidStaged = check()
    expect(invalidStaged.status).not.toBe(0)
    expect(invalidStaged.stdout).toContain('Parsing error')

    git('add', 'src')
    writeFileSync(file, 'export const value =\n')
    const validStaged = check()
    expect(validStaged.stdout + validStaged.stderr).toBe('')
    expect(validStaged.status).toBe(0)

    git(
      '-c',
      'user.name=Test',
      '-c',
      'user.email=test@example.invalid',
      '-c',
      'commit.gpgsign=false',
      '-c',
      'core.hooksPath=/dev/null',
      'commit',
      '-qm',
      'Base collection tooling fixture',
    )
    git('rm', '--cached', '--force', 'src/file with spaces.js')
    writeFileSync(path.join(directory, 'notes.md'), 'Collection notes\n')
    git('add', 'notes.md')
    const documentationOnly = check()
    expect(documentationOnly.status).toBe(0)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
