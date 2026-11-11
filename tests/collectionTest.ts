import type { BuildsData, BuildsDataFile } from '../src/lib/schema/BuildsData.schema.ts'
import { test as base, expect, type Page } from '@playwright/test'
import { cpSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const configuredPath = process.env.POE_TEST_JSON_PATH
if (!configuredPath || !configuredPath.startsWith(path.join(tmpdir(), 'poe-app-tests-'))) {
  throw new Error('Browser tests require a disposable collection directory')
}

export const collectionPath = configuredPath
const saveEndpoint = /\/_app\/remote\/[^/]+\/saveData$/u

export const openAddBuild = async (page: Page, category = 'melee') => {
  await page.locator(`#${category}`).getByRole('button', { name: 'Add build', exact: true }).click()
  await expect(page.getByLabel('New YouTube URL', { exact: true })).toBeFocused()
}

export const openManualEditor = async (page: Page) => {
  await page.getByRole('button', { name: 'Manual entry', exact: true }).click()
  await expect(page.getByLabel('Title', { exact: true })).toBeFocused()
}

const normalizeCollection = (collection: BuildsDataFile) => ({
  ...collection,
  buildList: collection.buildList.map((category) => ({
    ...category,
    builds: category.builds.map((build) => ({ pin: false, skip: false, ...build })),
  })),
})

export const saveBrowserCollection = async (page: Page, expected: BuildsData) => {
  const responsePromise = page.waitForResponse(
    (candidate) => candidate.request().method() === 'POST' && saveEndpoint.test(new URL(candidate.url()).pathname),
  )
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  const response = await responsePromise
  expect(response.ok()).toBe(true)
  await response.finished()
  expect((await response.json()).type).toBe('result')
  const { currentVersion, versions, ...collection } = expected
  await expect
    .poll(() => [
      JSON.parse(readFileSync(path.join(collectionPath, 'versions.json'), 'utf8')),
      normalizeCollection(
        JSON.parse(readFileSync(path.join(collectionPath, `data-${currentVersion.replaceAll('.', '-')}.json`), 'utf8')),
      ),
    ])
    .toEqual([{ currentVersion, versions }, normalizeCollection(collection)])
}

export const test = base.extend({
  page: async ({ page }, provide) => {
    rmSync(collectionPath, { recursive: true, force: true })
    cpSync('tests/fixtures', collectionPath, { recursive: true })
    await provide(page)
  },
})

export { expect } from '@playwright/test'
