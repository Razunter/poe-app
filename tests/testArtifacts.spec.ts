import { prepareTestArtifacts } from './testArtifacts.ts'
import { expect, test } from '@playwright/test'
import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

test('artifact cleanup expires and caps only owned directories without following symlinks', () => {
  const temporary = mkdtempSync(path.join(tmpdir(), 'poe-test-artifacts-'))
  const root = path.join(temporary, 'test-results')
  const now = 1_800_000_000_000
  const day = 24 * 60 * 60 * 1_000
  const run = (created: number, id: number) => `run-${created}-00000000-0000-0000-0000-${String(id).padStart(12, '0')}`
  const current = run(now, 100)
  const recent = Array.from({ length: 12 }, (_, index) => run(now - index * 60 * 60 * 1_000, index))
  const expired = run(now - 8 * day, 50)
  const linked = run(now - 9 * day, 51)
  const unrelatedFile = run(now - 9 * day, 52)
  const evidence = path.join(temporary, '.omp')

  try {
    mkdirSync(root)
    mkdirSync(evidence)
    writeFileSync(path.join(evidence, 'proof.txt'), 'keep outside evidence')
    for (const name of [...recent, expired]) {
      mkdirSync(path.join(root, name))
      writeFileSync(path.join(root, name, 'trace.zip'), 'retained trace')
    }

    symlinkSync(evidence, path.join(root, expired, 'external'), 'dir')
    symlinkSync(evidence, path.join(root, linked), 'dir')
    writeFileSync(path.join(root, unrelatedFile), 'keep matching file')
    for (const name of ['.agents', '.omp', 'unrelated']) {
      mkdirSync(path.join(root, name))
      writeFileSync(path.join(root, name, 'proof.txt'), 'keep unrelated evidence')
    }

    prepareTestArtifacts(root, current, now)
    expect(readdirSync(root).toSorted()).toEqual(
      [...recent.slice(0, 9), current, linked, unrelatedFile, '.agents', '.omp', 'unrelated'].toSorted(),
    )
    expect(readFileSync(path.join(root, recent[0], 'trace.zip'), 'utf8')).toBe('retained trace')
    expect(readFileSync(path.join(evidence, 'proof.txt'), 'utf8')).toBe('keep outside evidence')
    expect(readFileSync(path.join(root, unrelatedFile), 'utf8')).toBe('keep matching file')
    expect(lstatSync(path.join(root, linked)).isSymbolicLink()).toBe(true)
    for (const name of ['.agents', '.omp', 'unrelated']) {
      expect(readFileSync(path.join(root, name, 'proof.txt'), 'utf8')).toBe('keep unrelated evidence')
    }

    const nextRun = run(now + 8 * day, 101)
    prepareTestArtifacts(root, nextRun, now + 8 * day)
    expect(readdirSync(root).toSorted()).toEqual(
      [nextRun, linked, unrelatedFile, '.agents', '.omp', 'unrelated'].toSorted(),
    )

    const linkedRoot = path.join(temporary, 'linked-results')
    symlinkSync(evidence, linkedRoot, 'dir')
    expect(() => prepareTestArtifacts(linkedRoot, current, now)).toThrow('must be a real directory')
    expect(readdirSync(evidence)).toEqual(['proof.txt'])
  } finally {
    rmSync(temporary, { recursive: true, force: true })
  }
})
