import type { Build } from '../src/lib/schema/Build.schema.ts'
import { type BuildsDataFile } from '../src/lib/schema/BuildsData.schema.ts'
import { collectionPath, test as collectionTest, expect } from './collectionTest.ts'
import { createSyncHarness, deferred, type SyncHarness } from './syncHarness.ts'
import type { Locator, Page } from '@playwright/test'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const oldUrl = 'https://www.youtube.com/watch?v=ZxXjPVJQyk8'
const newId = 'fjCN-vN_Tvk'
const newUrl = `https://www.youtube.com/watch?v=${newId}`
const otherId = 'AbCdEfGhI12'
const otherUrl = `https://www.youtube.com/watch?v=${otherId}`
const guideUrl = 'https://example.com/written-guide'
const metadata = (id = newId, title = 'Flicker Strike 3.30 starter', channelTitle = 'MAGEFIST') => ({
  kind: 'youtube#videoListResponse',
  etag: `fixture-${id}`,
  items: [
    {
      kind: 'youtube#video',
      etag: `fixture-item-${id}`,
      id,
      snippet: {
        publishedAt: '2026-11-01T12:00:00Z',
        channelId: 'UCfixtureMagefist',
        title,
        description: 'A new Path of Exile starter guide.',
        channelTitle,
        thumbnails: {
          high: { url: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, width: 480, height: 360 },
          standard: { url: `https://i.ytimg.com/vi/${id}/sddefault.jpg`, width: 640, height: 480 },
          maxres: { url: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`, width: 1_280, height: 720 },
        },
      },
    },
  ],
  pageInfo: { totalResults: 1, resultsPerPage: 1 },
})
const thumbs = (id = newId) => ({
  '480w': `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  '640w': `https://i.ytimg.com/vi/${id}/sddefault.jpg`,
  '1280w': `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
})
const seed = (): BuildsDataFile => ({
  types: { melee: 'Melee', spells: 'Spells' },
  buildList: [
    {
      type: 'melee',
      builds: [
        {
          title: 'Curated red cyclone',
          author: 'Mage Fist',
          url: oldUrl,
          video: oldUrl,
          videothumb: { '480w': 'https://i.ytimg.com/vi/ZxXjPVJQyk8/hqdefault.jpg' },
          versions: ['3.28', '3.29'],
          tags: ['league starter', 'curated'],
          pin: true,
          skip: true,
        },
        {
          title: 'Flicker Strike written',
          author: 'Known author',
          url: guideUrl,
          video: oldUrl,
          videothumb: { '480w': 'https://i.ytimg.com/vi/ZxXjPVJQyk8/hqdefault.jpg' },
          versions: ['3.29', '3.30'],
          tags: ['written'],
          pin: false,
          skip: false,
        },
      ],
    },
    {
      type: 'spells',
      builds: [
        {
          title: 'Hidden totem archive',
          author: 'Unrelated archivist',
          url: 'https://example.com/secret-archive',
          versions: ['3.28'],
          tags: ['untouched'],
          skip: true,
        },
      ],
    },
  ],
})
const versions = {
  currentVersion: '3.30',
  versions: [
    { version: '3.28', name: 'Historical one' },
    { version: '3.29', name: 'Historical two' },
    { version: '3.30', name: 'Current league' },
  ],
}
const collectionFile = path.join(collectionPath, 'data-3-30.json')
const readPair = () => [
  JSON.parse(readFileSync(path.join(collectionPath, 'versions.json'), 'utf8')),
  JSON.parse(readFileSync(collectionFile, 'utf8')),
]
const test = collectionTest.extend<{ sync: SyncHarness }>({
  sync: async ({ page }, provide) => {
    writeFileSync(collectionFile, JSON.stringify(seed()))
    writeFileSync(path.join(collectionPath, 'versions.json'), JSON.stringify(versions))
    const sync = await createSyncHarness(page)
    sync.control.videoResults.set(newId, metadata())
    sync.control.videoResults.set(otherId, metadata(otherId, 'Other video title', 'Other channel'))
    try {
      await sync.interceptApp()
      await provide(sync)
    } finally {
      await sync.close()
    }
  },
})
const add = async (page: Page, category = 'melee') => {
  await page.locator(`#${category}`).getByRole('button', { name: 'Add build', exact: true }).click()
  await expect(page.getByLabel('New YouTube URL', { exact: true })).toBeFocused()
}

const lookup = async (page: Page, url = newUrl) => {
  await page.getByLabel('New YouTube URL', { exact: true }).fill(url)
  await page.getByRole('button', { name: 'Find candidates', exact: true }).click()
}

const candidate = (page: Page, title = 'Curated red cyclone') =>
  page
    .getByRole('dialog')
    .locator('article')
    .filter({ has: page.getByRole('heading', { name: title, exact: true }) })
const replace = async (page: Page, title = 'Curated red cyclone') => {
  await candidate(page, title).getByRole('button', { name: 'Review replacement', exact: true }).click()
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue(title)
}

const choose = async (input: Locator, value: string) => {
  await input.fill(value)
  await input.press('ArrowDown')
  await input.press('Enter')
}

const apply = async (page: Page) => {
  await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click()
}

const persist = async (page: Page, expected: BuildsDataFile) => {
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  const normalize = (collection: BuildsDataFile) => ({
    ...collection,
    buildList: collection.buildList.map((category) => ({
      ...category,
      builds: category.builds.map((build) => ({ pin: false, skip: false, ...build })),
    })),
  })
  await expect
    .poll(() => {
      const [savedVersions, savedCollection] = readPair()
      return [savedVersions, normalize(savedCollection)]
    })
    .toEqual([versions, normalize(expected)])
}

const assertOriginal = async (page: Page) => {
  await page.getByRole('checkbox', { name: 'Show outdated', exact: true }).check()
  await expect(page.locator('article')).toHaveCount(3)
  await expect(page.locator('#melee').getByRole('link', { name: oldUrl, exact: true })).toBeVisible()
  expect(readPair()).toEqual([versions, seed()])
}

test('AE1 AE2 offers mismatched-author and mismatched-title candidates with review details', async ({ page, sync }) => {
  await page.goto('/')
  await add(page)
  await lookup(page)
  const row = candidate(page)
  for (const text of ['Mage Fist', 'Melee', '3.28', '3.29']) {
    await expect(row).toContainText(text)
  }

  await expect(row.getByRole('link', { name: oldUrl, exact: false })).toHaveAttribute('href', oldUrl)
  await expect(row.locator('.reason')).toBeVisible()
  await expect(row.locator('.reason')).not.toBeEmpty()
  await expect(candidate(page, 'Flicker Strike written')).toBeVisible()
  await expect(candidate(page, 'Hidden totem archive')).toHaveCount(0)
  for (const query of ['Hidden totem', 'Unrelated archivist', 'secret-archive']) {
    await page.getByRole('searchbox', { name: 'Search all saved builds', exact: true }).fill(query)
    await expect(candidate(page, 'Hidden totem archive')).toBeVisible()
  }

  await replace(page, 'Hidden totem archive')
  await expect(page.getByLabel('URL', { exact: true })).toHaveValue('https://example.com/secret-archive')
  expect(sync.control.requestedIDs).toEqual([newId])
  await page.keyboard.press('Escape')
  await assertOriginal(page)
})

test('AE3 distinguishes invalid, failed, empty and retry states without stale manual metadata', async ({
  page,
  sync,
}) => {
  await page.goto('/')
  await add(page)
  await lookup(page, 'https://not-youtube.example/watch?v=fjCN-vN_Tvk')
  await expect(page.getByRole('alert')).toBeVisible()
  expect(sync.control.requestedIDs).toEqual([])
  sync.control.videoErrors.set(newId, new Error('Controlled lookup failure'))
  await lookup(page)
  await expect.poll(() => sync.control.requestedIDs.length).toBe(1)
  await expect(page.getByRole('alert')).toBeVisible()
  sync.control.videoErrors.delete(newId)
  sync.control.videoResults.set(newId, { items: [] })
  await page.getByRole('button', { name: 'Find candidates', exact: true }).click()
  await expect.poll(() => sync.control.requestedIDs.length).toBe(2)
  await expect(page.getByRole('alert')).toBeVisible()
  sync.control.videoResults.set(newId, metadata())
  await page.getByRole('button', { name: 'Find candidates', exact: true }).click()
  await expect.poll(() => sync.control.requestedIDs.length).toBe(3)
  await expect(candidate(page)).toBeVisible()
  await page.getByLabel('New YouTube URL', { exact: true }).fill(otherUrl)
  await expect(page.getByRole('button', { name: 'Add as new', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Manual entry', exact: true }).click()
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('')
  await expect(page.locator('.field-author .in-selection')).toHaveCount(0)
  await expect(page.getByLabel('URL', { exact: true })).toHaveValue(otherUrl)
  await page.keyboard.press('Escape')
  await assertOriginal(page)
})

test('AE2 empty suggestions still allow searching all saved builds', async ({ page, sync }) => {
  sync.control.videoResults.set(newId, metadata(newId, 'An unrelated documentary', 'Brand new channel'))
  await page.goto('/')
  await add(page)
  await lookup(page)
  await expect(page.getByRole('heading', { name: 'An unrelated documentary', exact: true })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Suggested builds', exact: true }).locator('article')).toHaveCount(0)
  await page.getByRole('searchbox', { name: 'Search all saved builds', exact: true }).fill('secret-archive')
  await replace(page, 'Hidden totem archive')
  await page.keyboard.press('Escape')
  await assertOriginal(page)
})

test('AE3 manual continuation invalidates an in-flight lookup without importing its metadata', async ({
  page,
  sync,
}) => {
  const gate = deferred()
  sync.control.videoGates.set(newId, [gate.promise])
  await page.goto('/')
  await add(page)
  await lookup(page)
  await expect.poll(() => sync.control.requestedIDs.length).toBe(1)
  await page.getByRole('button', { name: 'Manual entry', exact: true }).click()
  await expect(page.getByLabel('URL', { exact: true })).toHaveValue(newUrl)
  const response = page.waitForResponse((result) => result.request().method() === 'POST')
  gate.resolve(undefined)
  await response
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('')
  await expect(page.locator('.field-author .in-selection')).toHaveCount(0)
  await expect(page.getByLabel('URL', { exact: true })).toHaveValue(newUrl)
  await page.keyboard.press('Escape')
  await persist(page, seed())
})

test('AE3 AE9 manual written-guide continuation trims the URL and saves without imported media', async ({
  page,
  sync,
}) => {
  await page.goto('/')
  await add(page)
  await lookup(page)
  await expect(candidate(page)).toBeVisible()
  const manualUrl = 'https://example.com/manual-written'
  await page.getByLabel('New YouTube URL', { exact: true }).fill(`  ${manualUrl}  `)
  await page.getByRole('button', { name: 'Manual entry', exact: true }).click()
  await expect(page.getByLabel('URL', { exact: true })).toHaveValue(manualUrl)
  await expect(page.getByLabel('Video URL', { exact: true })).toHaveValue('')
  await expect(page.locator('.field-author .in-selection')).toHaveCount(0)
  await page.getByLabel('Title', { exact: true }).fill('Manual written guide')
  await page.getByLabel('Pin build', { exact: true }).check()
  await page.getByLabel('Skip build', { exact: true }).check()
  await apply(page)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(readPair()).toEqual([versions, seed()])
  const expected = seed()
  expected.buildList[0].builds.push({
    title: 'Manual written guide',
    url: manualUrl,
    versions: ['3.30'],
    pin: true,
    skip: true,
  })
  await persist(page, expected)
  await page.reload()
  const saved = page
    .locator('article')
    .filter({ has: page.getByRole('heading', { name: 'Manual written guide', exact: true }) })
  await expect(saved.getByRole('link', { name: manualUrl, exact: true })).toBeVisible()
  await expect(saved.getByRole('img')).toHaveCount(0)
  expect(sync.control.requestedIDs).toEqual([newId])
})

for (const aba of [false, true]) {
  test(`AE3 rejects late ${aba ? 'A/B/A generations' : 'out-of-order A/B responses'}`, async ({ page, sync }) => {
    const first = deferred()
    const second = deferred()
    const third = deferred()
    sync.control.videoGates.set(newId, aba ? [first.promise, third.promise] : [first.promise])
    sync.control.videoGates.set(otherId, [second.promise])
    await page.goto('/')
    await add(page)
    await lookup(page)
    await expect.poll(() => sync.control.requestedIDs.length).toBe(1)
    await lookup(page, otherUrl)
    await expect.poll(() => sync.control.requestedIDs.length).toBe(2)
    if (aba) {
      await lookup(page)
      await expect.poll(() => sync.control.requestedIDs.length).toBe(3)
    }

    if (aba) {
      const firstResponse = page.waitForResponse((response) => response.request().method() === 'POST')
      first.resolve(undefined)
      await firstResponse
      await expect(page.getByRole('button', { name: 'Add as new', exact: true })).toHaveCount(0)
      const secondResponse = page.waitForResponse((response) => response.request().method() === 'POST')
      second.resolve(undefined)
      await secondResponse
      await expect(page.getByRole('button', { name: 'Add as new', exact: true })).toHaveCount(0)
      third.resolve(undefined)
    } else {
      second.resolve(undefined)
      await expect(page.getByRole('button', { name: 'Add as new', exact: true })).toBeVisible()
      const firstResponse = page.waitForResponse((response) => response.request().method() === 'POST')
      first.resolve(undefined)
      await firstResponse
    }

    await page.getByRole('button', { name: 'Add as new', exact: true }).click()
    await expect(page.getByLabel('Title', { exact: true })).toHaveValue(
      aba ? 'Flicker Strike 3.30 starter' : 'Other video title',
    )
    await expect(page.getByLabel('Video URL', { exact: true })).toHaveValue(aba ? newUrl : otherUrl)
    await page.keyboard.press('Escape')
    await assertOriginal(page)
  })
}

test('AE4 AE13 replacement preserves exact curated data and persists only on collection Save', async ({
  page,
  sync,
}) => {
  const before = readPair()
  await page.goto('/')
  await add(page)
  await lookup(page)
  await replace(page)
  await expect(page.locator('.field-author .in-selection')).toHaveText('Mage Fist')
  await expect(page.getByLabel('Pin build', { exact: true })).toBeChecked()
  await expect(page.getByLabel('Skip build', { exact: true })).toBeChecked()
  await expect(page.getByLabel('Video URL', { exact: true })).toHaveValue(newUrl)
  await expect(page.getByLabel('URL', { exact: true })).toHaveValue(newUrl)
  expect(readPair()).toEqual(before)
  await apply(page)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('#melee').getByRole('link', { name: newUrl, exact: true })).toBeVisible()
  expect(readPair()).toEqual(before)
  await page.reload()
  await assertOriginal(page)
  await add(page)
  await lookup(page)
  await replace(page)
  await apply(page)
  const expected = seed()
  Object.assign(expected.buildList[0].builds[0], {
    url: newUrl,
    video: newUrl,
    videothumb: thumbs(),
    versions: ['3.28', '3.29', '3.30'],
  })
  await persist(page, expected)
  await page.reload()
  await page.getByRole('checkbox', { name: 'Show outdated', exact: true }).check()
  await expect(page.locator('article')).toHaveCount(3)
  await expect(page.locator('#melee').getByRole('link', { name: oldUrl, exact: true })).toHaveCount(0)
  await expect(page.locator('#melee').getByRole('img', { name: 'Curated red cyclone', exact: true })).toHaveAttribute(
    'src',
    thumbs()['480w'],
  )
  expect(sync.control.requestedIDs).toEqual([newId, newId])
})

test('AE5 keeps written guides and already-current compatibility editable', async ({ page, sync }) => {
  await page.goto('/')
  await add(page)
  await lookup(page)
  await replace(page, 'Flicker Strike written')
  await expect(page.getByLabel('URL', { exact: true })).toHaveValue(guideUrl)
  await expect(page.locator('.editor-current')).toHaveText('3.30 · current')
  await page
    .locator('.field-versions .sv-item--container')
    .filter({ hasText: '3.30' })
    .getByRole('button', { name: 'Remove item', exact: true })
    .click()
  const input = page.getByLabel('Compatible game versions', { exact: false })
  await choose(input, '3.28')
  await apply(page)
  const expected = seed()
  Object.assign(expected.buildList[0].builds[1], { video: newUrl, videothumb: thumbs(), versions: ['3.29', '3.28'] })
  await persist(page, expected)
  await page.reload()
  await page.getByRole('checkbox', { name: 'Show outdated', exact: true }).check()
  await expect(page.getByRole('link', { name: guideUrl, exact: true })).toBeVisible()
  expect(sync.control.requestedIDs).toEqual([newId])
})

for (const reuse of [false, true]) {
  test(`AE6 AE8 new import ${reuse ? 'reuses selected saved spelling' : 'keeps deliberately new author'} in originating category`, async ({
    page,
    sync,
  }) => {
    await page.goto('/')
    await add(page, 'spells')
    await lookup(page)
    await page.getByRole('button', { name: 'Add as new', exact: true }).click()
    await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Flicker Strike 3.30 starter')
    await expect(page.locator('.field-author .in-selection')).toHaveText('MAGEFIST')
    await expect(page.getByText('New author', { exact: true })).toBeVisible()
    if (reuse) {
      await page.getByRole('button', { name: 'Use Mage Fist', exact: true }).click()
      await expect(page.locator('.field-author .in-selection')).toHaveText('Mage Fist')
      await expect(page.getByText('New author', { exact: true })).toHaveCount(0)
    }

    await apply(page)
    expect(readPair()).toEqual([versions, seed()])
    const expected = seed()
    expected.buildList[1].builds.push({
      title: 'Flicker Strike 3.30 starter',
      author: reuse ? 'Mage Fist' : 'MAGEFIST',
      url: newUrl,
      video: newUrl,
      videothumb: thumbs(),
      versions: ['3.30'],
      pin: false,
      skip: false,
    })
    await persist(page, expected)
    await page.reload()
    await page.getByRole('checkbox', { name: 'Show outdated', exact: true }).check()
    await expect(page.locator('#spells article')).toHaveCount(2)
    expect(sync.control.requestedIDs).toEqual([newId])
  })
}

test('AE7 known author has no badge and canceled new author leaves no saved identity', async ({ page, sync }) => {
  sync.control.videoResults.set(newId, metadata(newId, 'Known title', 'Mage Fist'))
  await page.goto('/')
  await add(page)
  await lookup(page)
  await page.getByRole('button', { name: 'Add as new', exact: true }).click()
  await expect(page.getByText('New author', { exact: true })).toHaveCount(0)
  await page.keyboard.press('Escape')
  sync.control.videoResults.set(newId, metadata())
  await add(page)
  await lookup(page)
  await page.getByRole('button', { name: 'Add as new', exact: true }).click()
  await expect(page.getByText('New author', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await add(page)
  await page.getByRole('button', { name: 'Manual entry', exact: true }).click()
  await expect(page.getByLabel('Title', { exact: true })).toBeFocused()
  await choose(page.locator('#editBuildAuthor'), 'MAGEFIST')
  await expect(page.getByText('New author', { exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await persist(page, seed())
})

for (const create of [false, true]) {
  test(`AE8 replacement moves exactly once into ${create ? 'a created category' : 'an existing category'}`, async ({
    page,
    sync,
  }) => {
    await page.goto('/')
    await add(page)
    await lookup(page)
    await replace(page)
    await choose(page.getByLabel('Type', { exact: true }), create ? 'New destination' : 'Spells')
    await apply(page)
    const expected = seed()
    const [moved] = expected.buildList[0].builds.splice(0, 1)
    Object.assign(moved, { url: newUrl, video: newUrl, videothumb: thumbs(), versions: ['3.28', '3.29', '3.30'] })
    if (create) {
      expected.types['new destination'] = 'New destination'
      expected.buildList.push({ type: 'new destination', builds: [moved] })
    } else {
      expected.buildList[1].builds.push(moved)
    }

    await persist(page, expected)
    await page.reload()
    await page.getByRole('checkbox', { name: 'Show outdated', exact: true }).check()
    await expect(page.locator('article')).toHaveCount(3)
    await expect(page.locator('#melee').getByRole('link', { name: newUrl, exact: true })).toHaveCount(0)
    await expect(page.getByRole('link', { name: newUrl, exact: true })).toHaveCount(1)
    expect(sync.control.requestedIDs).toEqual([newId])
  })
}

test('AE11 Reset restores saved replacement media and ordinary blank new defaults without applying', async ({
  page,
  sync,
}) => {
  await page.goto('/')
  await add(page)
  await lookup(page)
  await replace(page)
  await page.getByLabel('Title', { exact: true }).fill('Discard edits')
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Curated red cyclone')
  await expect(page.getByLabel('Video URL', { exact: true })).toHaveValue(oldUrl)
  await expect(page.getByLabel('URL', { exact: true })).toHaveValue(oldUrl)
  await apply(page)
  await persist(page, seed())
  await add(page)
  await lookup(page)
  await page.getByRole('button', { name: 'Add as new', exact: true }).click()
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  for (const label of ['Title', 'Video URL', 'URL']) {
    await expect(page.getByLabel(label, { exact: true })).toHaveValue('')
  }

  await expect(page.locator('.field-author .in-selection')).toHaveCount(0)
  await page.getByLabel('Title', { exact: true }).fill('Reset new draft')
  await page.getByLabel('URL', { exact: true }).fill('https://example.com/reset-new')
  await apply(page)
  const expected = seed()
  expected.buildList[0].builds.push({
    title: 'Reset new draft',
    url: 'https://example.com/reset-new',
    versions: ['3.30'],
    pin: false,
    skip: false,
  })
  await persist(page, expected)
  expect(sync.control.requestedIDs).toEqual([newId, newId])
})

test('AE12 invalid and duplicate replacement saves remain open and unchanged', async ({ page, sync }) => {
  await page.goto('/')
  await add(page)
  await lookup(page)
  await replace(page)
  await page.getByLabel('Video URL', { exact: true }).fill(['javascript', 'alert(1)'].join(':'))
  await expect(page.getByRole('dialog').locator('a[href^="javascript:"]')).toHaveCount(0)
  await apply(page)
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByLabel('Video URL', { exact: true }).fill(newUrl)
  await page.getByLabel('Title', { exact: true }).fill('')
  await apply(page)
  await expect(page.getByRole('dialog')).toBeVisible()
  expect(
    await page.getByLabel('Title', { exact: true }).evaluate((input: HTMLInputElement) => input.validity.valueMissing),
  ).toBe(true)
  await page.getByLabel('Title', { exact: true }).fill('Valid title')
  await page.getByLabel('URL', { exact: true }).fill('')
  await apply(page)
  await expect(page.getByRole('dialog')).toBeVisible()
  expect(
    await page.getByLabel('URL', { exact: true }).evaluate((input: HTMLInputElement) => input.validity.valueMissing),
  ).toBe(true)
  await page.getByLabel('URL', { exact: true }).fill(guideUrl)
  await apply(page)
  await expect(page.getByText('Duplicate URL: Flicker Strike written', { exact: true })).toBeVisible()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await persist(page, seed())
  expect(sync.control.requestedIDs).toEqual([newId])
})

for (const direct of [false, true]) {
  test(`AE9 AE10 AE14 full ${direct ? 'direct' : 'manual'} editor saves a cleared author and retains keyboard controls and empty-only video paste`, async ({
    page,
    sync,
  }) => {
    await page.goto('/')
    if (direct) {
      await page.getByRole('checkbox', { name: 'Show outdated', exact: true }).check()
      await page.locator('#melee article').first().getByRole('button', { name: 'Edit', exact: true }).click()
    } else {
      await add(page)
      await page.getByRole('button', { name: 'Manual entry', exact: true }).click()
    }

    const title = page.getByLabel('Title', { exact: true })
    await title.focus()
    await expect(title).toBeFocused()
    await title.fill('UPPER CASE TITLE')
    await title.press('Tab')
    await expect(page.getByRole('button', { name: 'low', exact: true })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(title).toHaveValue('upper case title')
    await choose(page.locator('#editBuildAuthor'), 'Known author')
    await choose(page.locator('#editBuildAuthor'), 'New manual author')
    await expect(page.getByText('New author', { exact: true })).toBeVisible()
    const author = page.locator('#editBuildAuthor')
    await author.focus()
    await author.press('Backspace')
    await author.fill('')
    await expect(page.locator('.field-author .in-selection')).toHaveCount(0)
    await page.getByLabel('URL', { exact: true }).fill('')
    const video = page.getByLabel('Video URL', { exact: true })
    await video.fill('')
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.evaluate((value) => navigator.clipboard.writeText(value), newUrl)
    await video.press('Control+V')
    await expect(page.getByLabel('URL', { exact: true })).toHaveValue(newUrl)
    await page.getByLabel('URL', { exact: true }).fill('https://example.com/manual-written')
    await page.evaluate((value) => navigator.clipboard.writeText(value), otherUrl)
    await video.press('Control+V')
    await expect(page.getByLabel('URL', { exact: true })).toHaveValue('https://example.com/manual-written')
    await video.fill('')
    const compatible = page.getByLabel('Compatible game versions', { exact: false })
    if (direct) {
      await choose(compatible, '3.30')
    } else {
      await choose(compatible, '3.28')
      await choose(compatible, '3.29')
    }

    await page.getByLabel('Pin build', { exact: true }).check()
    await page.getByLabel('Skip build', { exact: true }).uncheck()
    await expect(page.locator('.editor-current')).toHaveText('3.30 · current')
    await apply(page)
    await expect(page.getByRole('dialog')).toHaveCount(0)
    const expected = seed()
    const edited: Build = {
      ...(direct ? expected.buildList[0].builds[0] : {}),
      title: 'upper case title',
      url: 'https://example.com/manual-written',
      versions: direct ? ['3.28', '3.29', '3.30'] : ['3.30', '3.28', '3.29'],
      pin: true,
      skip: false,
    }
    delete edited.author
    delete edited.video
    delete edited.videothumb
    if (direct) {
      expected.buildList[0].builds[0] = edited
    } else {
      expected.buildList[0].builds.push(edited)
    }

    await persist(page, expected)
    await page.reload()
    await expect(page.getByRole('link', { name: 'https://example.com/manual-written', exact: true })).toBeVisible()
    expect(sync.control.requestedIDs).toEqual([])
  })
}
