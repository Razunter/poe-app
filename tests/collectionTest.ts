import { test as base } from '@playwright/test'
import { cpSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const configuredPath = process.env.POE_TEST_JSON_PATH
if (!configuredPath || !configuredPath.startsWith(path.join(tmpdir(), 'poe-app-tests-'))) {
  throw new Error('Browser tests require a disposable collection directory')
}

export const collectionPath = configuredPath

export const test = base.extend({
  page: async ({ page }, provide) => {
    rmSync(collectionPath, { recursive: true, force: true })
    cpSync('tests/fixtures', collectionPath, { recursive: true })
    await provide(page)
  },
})

export { expect } from '@playwright/test'
