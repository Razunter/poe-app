import { ESLint } from 'eslint'
import { execFileSync } from 'node:child_process'
import process from 'node:process'

execFileSync('git', ['diff', '--cached', '--check'], { stdio: 'inherit' })
const sourceExtension = /\.(?:[cm]?[jt]sx?|svelte)$/u
const files = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter((file) => sourceExtension.test(file))

if (files.length > 0) {
  const eslint = new ESLint()
  const results = []
  for (const file of files) {
    if (await eslint.isPathIgnored(file)) {
      continue
    }

    const source = execFileSync('git', ['show', `:${file}`], { encoding: 'utf8' })
    results.push(...(await eslint.lintText(source, { filePath: file })))
  }

  const formatter = await eslint.loadFormatter('stylish')
  const output = await formatter.format(results)
  if (output) {
    process.stdout.write(output)
  }

  process.exitCode = results.some((result) => result.errorCount > 0) ? 1 : 0
}
