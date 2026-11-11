import type { BuildsData, BuildsDataFile } from '../src/lib/schema/BuildsData.schema.ts'
import { test as base, expect, type Page } from '@playwright/test'
import { cpSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
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

type NetworkFailure =
  | { kind: 'http'; method: string; url: string; resourceType: string; status: number }
  | { kind: 'transport'; method: string; url: string; resourceType: string; failure: string }
export type NetworkLog = { failures: NetworkFailure[]; thumbnails: string[]; blocked: string[] }

const youtubeThumbnail = /^\/vi\/[\w-]+\/(?:hq|sd|maxres)default\.jpg$/u
const fixtureThumbnails = ['https://example.com/thumbnail.jpg', 'https://example.com/manual-thumbnail.jpg']
const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')

export const test = base.extend<{ network: NetworkLog }>({
  network: [
    async ({ context, baseURL }, provide, testInfo) => {
      const network: NetworkLog = { failures: [], thumbnails: [], blocked: [] }
      context.on('response', (response) => {
        const request = response.request()
        if (response.status() >= 400) {
          network.failures.push({
            kind: 'http',
            method: request.method(),
            url: request.url(),
            resourceType: request.resourceType(),
            status: response.status(),
          })
        }
      })
      context.on('requestfailed', (request) => {
        network.failures.push({
          kind: 'transport',
          method: request.method(),
          url: request.url(),
          resourceType: request.resourceType(),
          failure: request.failure()?.errorText ?? 'unknown',
        })
      })
      const appOrigin = new URL(baseURL ?? '').origin
      await context.route(
        (url) => url.origin !== appOrigin,
        async (route) => {
          const request = route.request()
          const url = new URL(request.url())
          const thumbnail =
            (url.origin === 'https://i.ytimg.com' && youtubeThumbnail.test(url.pathname)) ||
            fixtureThumbnails.includes(url.href)
          if (request.method() === 'GET' && request.resourceType() === 'image' && thumbnail) {
            network.thumbnails.push(url.href)
            await route.fulfill({ contentType: 'image/gif', body: pixel })
          } else {
            network.blocked.push(`${request.method()} ${request.resourceType()} ${url.href}`)
            await route.abort('blockedbyclient')
          }
        },
      )
      await provide(network)
      const networkPath = testInfo.outputPath('network.json')
      writeFileSync(networkPath, JSON.stringify(network, null, 2))
      await testInfo.attach('network.json', { path: networkPath, contentType: 'application/json' })
      expect(network.blocked, 'unexpected external requests').toEqual([])
    },
    { auto: true },
  ],
  page: async ({ page }, provide) => {
    rmSync(collectionPath, { recursive: true, force: true })
    cpSync('tests/fixtures', collectionPath, { recursive: true })
    await provide(page)
  },
})

export { expect } from '@playwright/test'
