import { ESLint } from 'eslint'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import process from 'node:process'

const sourceExtension = /\.(?:[cm]?[jt]sx?|svelte)$/u
const gitPaths = (...args) => execFileSync('git', args, { encoding: 'utf8' }).split('\0')
const candidates =
  process.argv.length > 2
    ? process.argv.slice(2)
    : [
        ...gitPaths('diff', '-z', '--name-only', '--diff-filter=d', 'HEAD'),
        ...gitPaths('ls-files', '-z', '--others', '--exclude-standard'),
      ]

const eslint = new ESLint()
const results = []
for (const file of new Set(candidates)) {
  if (!sourceExtension.test(file) || !existsSync(file) || (await eslint.isPathIgnored(file))) {
    continue
  }

  results.push(...(await eslint.lintText(readFileSync(file, 'utf8'), { filePath: file })))
}

const formatter = await eslint.loadFormatter('stylish')
const output = await formatter.format(results)
if (output) {
  process.stdout.write(output)
}

process.exitCode = results.some((result) => result.errorCount > 0) ? 1 : 0
