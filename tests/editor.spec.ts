import { type BuildsData, type BuildsDataFile, BuildsDataSchema } from '../src/lib/schema/BuildsData.schema.ts'
import { GameVersionsSchema } from '../src/lib/schema/GameVersion.schema.ts'
import {
  collectionPath,
  expect,
  openAddBuild,
  openManualEditor,
  saveBrowserCollection,
  test,
} from './collectionTest.ts'
import { createSyncHarness } from './syncHarness.ts'
import type { Page } from '@playwright/test'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const collectionFile = path.join(collectionPath, 'data-3-26.json')
const readCollection = (): BuildsDataFile => JSON.parse(readFileSync(collectionFile, 'utf8'))
const editorCollection = (): BuildsDataFile => ({
  types: { melee: 'Melee', spells: 'Spells' },
  buildList: [
    {
      type: 'melee',
      builds: [
        { title: 'Same title', url: 'https://example.com/original', versions: ['3.26'], skip: true },
        { title: 'Same title', url: 'https://example.com/neighbor', versions: ['3.26'], skip: true },
      ],
    },
    {
      type: 'spells',
      builds: [{ title: 'Destination', url: 'https://example.com/destination', versions: ['3.26'], skip: true }],
    },
  ],
})

const editorVersions = {
  currentVersion: '3.26',
  versions: [{ version: '3.26', name: 'Test league' }],
}
const saveCollection = async (
  page: Page,
  expected: BuildsDataFile,
  versions: Pick<BuildsData, 'currentVersion' | 'versions'> = editorVersions,
) => {
  await saveBrowserCollection(page, { ...expected, ...versions })
}

const selectCategory = async (page: Page, category: string) => {
  const input = page.getByLabel('Type', { exact: true })
  await input.fill(category)
  await input.press('ArrowDown')
  await input.press('Enter')
}

const saveDialog = async (page: Page) => {
  await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click()
}

test('renders bundled icons in actions and checked controls', async ({ page }) => {
  await page.goto('/')
  for (const name of ['Settings', 'Add build', 'Edit']) {
    await expect(page.getByRole('button', { name, exact: true }).locator('svg')).toBeVisible()
  }

  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Close', exact: true }).locator('svg')).toBeVisible()
  await expect(page.getByRole('button', { name: '3.26', exact: true }).locator('svg')).toBeVisible()
  const workInProgress = page.getByRole('checkbox', { name: 'Work in progress' })
  await workInProgress.check()
  await expect(workInProgress.locator('svg')).toBeVisible()
})

test('edits a build loaded from disk without persisting changes', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Edit', exact: true }).click()
  await page.getByLabel('Title', { exact: true }).fill('Updated starter')
  await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Updated starter', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Fixture starter', exact: true })).toBeVisible()
})

test('edits an omitted work-in-progress flag in version settings', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await page.getByRole('checkbox', { name: 'Work in progress' }).check()
  await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click()
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'Work in progress' })).toBeChecked()
})

test('new version can include the current version as compatible before saving settings', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await page.getByRole('button', { name: 'Add new version', exact: true }).click()
  await page.getByLabel('Version number', { exact: true }).first().fill('3.27')
  await page.getByLabel('League name', { exact: true }).first().fill('Next league')
  const compatible = page.getByLabel('Compatible versions', { exact: true }).first()
  await compatible.fill('3.27')
  await expect(page.getByText('No matching options', { exact: true })).toBeVisible()
  await compatible.fill('3.26')
  await expect(page.getByText('No matching options', { exact: true })).not.toBeVisible()
  await compatible.press('ArrowDown')
  await compatible.press('Enter')
  await saveDialog(page)
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  const savedCompatible = page
    .locator('.sv-control')
    .filter({ has: page.getByLabel('Compatible versions', { exact: true }).first() })
  await expect(savedCompatible.locator('.sv-item--container')).toHaveText('3.26')
})

for (const move of [false, true]) {
  test(`build identity preserves neighbors after URL edit${move ? ' and category move' : ''}`, async ({ page }) => {
    const collection = editorCollection()
    writeFileSync(collectionFile, JSON.stringify(collection))
    await page.goto('/')
    await page.locator('#melee article').first().getByRole('button', { name: 'Edit', exact: true }).click()
    await page.getByLabel('URL', { exact: true }).fill('https://example.com/edited')
    if (move) {
      await selectCategory(page, 'Spells')
    }

    await saveDialog(page)
    await expect(page.getByRole('dialog')).toHaveCount(0)
    const edited = { ...collection.buildList[0].builds[0], url: 'https://example.com/edited' }
    if (move) {
      collection.buildList[0].builds.shift()
      collection.buildList[1].builds.push(edited)
    } else {
      collection.buildList[0].builds[0] = edited
    }

    await saveCollection(page, collection)
    await page.reload()
    await expect(page.locator('article')).toHaveCount(3)
    await expect(page.getByRole('link', { name: 'https://example.com/original', exact: true })).toHaveCount(0)
    await expect(
      page.locator(move ? '#spells' : '#melee').getByRole('link', {
        name: 'https://example.com/edited',
        exact: true,
      }),
    ).toBeVisible()
  })

  test(`duplicate URL rejects same-title collision${move ? ' during category move' : ''}`, async ({ page }) => {
    const collection = editorCollection()
    writeFileSync(collectionFile, JSON.stringify(collection))
    await page.goto('/')
    await page.locator('#melee article').first().getByRole('button', { name: 'Edit', exact: true }).click()
    await page.getByLabel('URL', { exact: true }).fill('https://example.com/neighbor')
    if (move) {
      await selectCategory(page, 'Spells')
    }

    await saveDialog(page)
    await expect(page.getByText('Duplicate URL: Same title', { exact: true })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await saveCollection(page, collection)
  })
}

test('duplicate URL allows one original but rejects another record with that URL', async ({ page }) => {
  const collection = editorCollection()
  writeFileSync(collectionFile, JSON.stringify(collection))
  await page.goto('/')
  await page.locator('#melee article').first().getByRole('button', { name: 'Edit', exact: true }).click()
  await page.getByLabel('Title', { exact: true }).fill('Renamed original')
  await saveDialog(page)
  await expect(page.getByRole('heading', { name: 'Renamed original', exact: true })).toBeVisible()
  collection.buildList[0].builds[0].title = 'Renamed original'
  await saveCollection(page, collection)

  collection.buildList[1].builds[0].url = 'https://example.com/original'
  writeFileSync(collectionFile, JSON.stringify(collection))
  await page.reload()
  await page.locator('#melee article').first().getByRole('button', { name: 'Edit', exact: true }).click()
  await saveDialog(page)
  await expect(page.getByText('Duplicate URL: Destination', { exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByText('Duplicate URLs detected:', { exact: true })).toBeVisible()
  expect(readCollection()).toEqual(collection)
})

test('duplicate URL gives new builds no self exemption even when the existing title is empty', async ({ page }) => {
  const collection = editorCollection()
  collection.buildList[0].builds[0].title = ''
  writeFileSync(collectionFile, JSON.stringify(collection))
  await page.goto('/')
  await openAddBuild(page)
  await openManualEditor(page)
  await page.getByLabel('Title', { exact: true }).fill('Same title')
  await page.getByLabel('URL', { exact: true }).fill('https://example.com/original')
  await saveDialog(page)
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('dialog').getByText('https://example.com/original', { exact: false })).toBeVisible()
  await page.keyboard.press('Escape')
  await saveCollection(page, collection)
})

test('optional video clears video and thumbnails through save and reload', async ({ page }) => {
  const collection = editorCollection()
  collection.buildList[0].builds[0].video = 'https://www.youtube.com/watch?v=fixture'
  collection.buildList[0].builds[0].videothumb = { '480w': 'https://example.com/thumbnail.jpg' }
  writeFileSync(collectionFile, JSON.stringify(collection))
  await page.goto('/')
  await page.locator('#melee article').first().getByRole('button', { name: 'Edit', exact: true }).click()
  await page.getByLabel('Video URL', { exact: true }).fill('')
  await saveDialog(page)
  delete collection.buildList[0].builds[0].video
  delete collection.buildList[0].builds[0].videothumb
  await saveCollection(page, collection)
  await page.reload()
  await expect(page.locator('#melee article').first().getByRole('img')).toHaveCount(0)
  await page.locator('#melee article').first().getByRole('button', { name: 'Edit', exact: true }).click()
  await expect(page.getByLabel('Video URL', { exact: true })).toHaveValue('')
})

test('replacing the collection on disk leaks no previous build into the next navigation', async ({ page }) => {
  const previousTitle = 'Previous collection build'
  const previousThumbnail = 'https://i.ytimg.com/vi/PreviousBld/hqdefault.jpg'
  const previous = editorCollection()
  previous.buildList[0].builds[0].title = previousTitle
  previous.buildList[0].builds[0].videothumb = { '480w': previousThumbnail }
  writeFileSync(collectionFile, JSON.stringify(previous))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: previousTitle, exact: true })).toBeVisible()
  await expect(page.getByRole('img', { name: previousTitle, exact: true })).toBeVisible()

  const collection = editorCollection()
  writeFileSync(collectionFile, JSON.stringify(collection))
  const response = await page.goto('/')
  expect(response?.ok()).toBe(true)
  const html = await response?.text()
  expect(html).not.toContain(previousTitle)
  expect(html).not.toContain(previousThumbnail)
  await expect(page.locator('#melee article')).toHaveCount(2)
  await expect(page.getByText(previousTitle)).toHaveCount(0)

  await page.locator('#melee article').first().getByRole('button', { name: 'Edit', exact: true }).click()
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Same title')
  await page.getByLabel('Title', { exact: true }).fill('Fresh collection build')
  await saveDialog(page)
  collection.buildList[0].builds[0].title = 'Fresh collection build'
  await saveCollection(page, collection)
})

test('optional video rejects malformed nonempty input before applying any collection changes', async ({ page }) => {
  const collection = editorCollection()
  writeFileSync(collectionFile, JSON.stringify(collection))
  await page.goto('/')
  await page.locator('#melee article').first().getByRole('button', { name: 'Edit', exact: true }).click()
  await page.getByLabel('Title', { exact: true }).fill('Must not apply')
  await page.getByLabel('Video URL', { exact: true }).fill('not a URL')
  await saveDialog(page)
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByRole('dialog')).toBeVisible()
  expect(readCollection()).toEqual(collection)
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await saveCollection(page, collection)
  await page.reload()
  await page.locator('#melee article').first().getByRole('button', { name: 'Edit', exact: true }).click()
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Same title')
  await expect(page.getByLabel('Video URL', { exact: true })).toHaveValue('')
  expect(readCollection()).toEqual(collection)
})

test('version format shares exact component limits at load and save boundaries', () => {
  for (const [version, valid] of [
    ['3.26', true],
    ['3.26.1', true],
    ['0.0', true],
    ['9.99.99', true],
    ['3.26a1', false],
    ['33.26', false],
    ['3.266', false],
    ['3.26.123', false],
    ['3.26.1.2', false],
    ['3.26\n', false],
  ] as const) {
    const metadata = { currentVersion: version, versions: [{ version, name: 'Test', compatible: [version] }] }
    expect(GameVersionsSchema.safeParse(metadata).success, version).toBe(valid)
    expect(BuildsDataSchema.safeParse({ ...editorCollection(), ...metadata }).success, version).toBe(valid)
    expect(
      GameVersionsSchema.safeParse({
        currentVersion: '3.26',
        versions: [{ version: '3.26', name: 'Test', compatible: [version] }],
      }).success,
      `compatible ${version}`,
    ).toBe(valid)
    expect(
      GameVersionsSchema.safeParse({
        currentVersion: version,
        versions: [{ version: '3.26', name: 'Test' }],
      }).success,
      `currentVersion ${version}`,
    ).toBe(valid)
  }
})

test('version format rejects malformed separator and saves valid multipart settings', async ({ page }) => {
  const sync = await createSyncHarness(page)
  try {
    await sync.interceptApp()
    writeFileSync(collectionFile, JSON.stringify(editorCollection()))
    await page.goto('/')
    await page.getByRole('button', { name: 'Settings', exact: true }).click()
    await page.getByRole('button', { name: 'Add new version', exact: true }).click()
    const number = page.getByLabel('Version number', { exact: true }).first()
    await number.fill('3.26a1')
    await page.getByLabel('League name', { exact: true }).first().fill('Multipart league')
    await saveDialog(page)
    await expect(page.getByRole('dialog')).toBeVisible()
    expect(await number.evaluate((input: HTMLInputElement) => input.validity.patternMismatch)).toBe(true)
    await number.fill('3.26.1')
    await saveDialog(page)
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await page.getByRole('button', { name: 'Sort builds', exact: true }).click()
    await page.getByRole('button', { name: 'Sync builds', exact: true }).click()
    await expect(page.getByText('Sync complete', { exact: true })).toBeVisible()
    await saveCollection(page, editorCollection(), {
      ...editorVersions,
      versions: [...editorVersions.versions, { version: '3.26.1', name: 'Multipart league' }],
    })
    await page.reload()
    await page.getByRole('button', { name: 'Settings', exact: true }).click()
    await expect(page.getByRole('button', { name: '3.26.1', exact: true })).toBeVisible()
  } finally {
    await sync.close()
  }
})

test('build identity rejects a missing original without creating a category or deleting neighbors', async ({
  page,
}) => {
  const sync = await createSyncHarness(page)
  const data = {
    ...editorCollection(),
    currentVersion: '3.26',
    versions: [{ version: '3.26', name: 'Test league' }],
  }
  data.types.uncreated = 'Uncreated'
  try {
    await sync.open(data)
    await page.evaluate(() => syncHarness.mountEditor('https://example.com/original'))
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByLabel('URL', { exact: true }).fill('https://example.com/edited')
    await selectCategory(page, 'Uncreated')
    await page.evaluate(() => syncHarness.data.buildList[0].builds.shift())
    data.buildList[0].builds.shift()
    await saveDialog(page)
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.getByRole('dialog')).toBeVisible()
    expect(await page.evaluate(() => JSON.parse(JSON.stringify(syncHarness.data)))).toEqual(data)
  } finally {
    await sync.close()
  }
})
