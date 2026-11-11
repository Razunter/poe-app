import type { Build } from '../src/lib/schema/Build.schema.ts'
import type { BuildsData } from '../src/lib/schema/BuildsData.schema.ts'
import { collectionPath, test as collectionTest, expect } from './collectionTest.ts'
import { createSyncHarness, deferred, type SyncHarness } from './syncHarness.ts'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const test = collectionTest.extend<{ sync: SyncHarness }>({
  sync: async ({ page }, provide) => {
    const sync = await createSyncHarness(page)
    try {
      await provide(sync)
    } finally {
      await sync.close()
    }
  },
})

const currentVersion = '3.26.1'
const videoID = 'Abc_123-XYZ'
const oldThumbnail = 'https://i.ytimg.com/vi/old/hqdefault.jpg'
const thumbnail = `https://i.ytimg.com/vi/${videoID}/hqdefault.jpg`

// Same-width thread ids keep one fixture URL from being a substring of another.
let threadID = 3_000_000
const build = (title: string): Build => ({
  title,
  url: `https://www.pathofexile.com/forum/view-thread/${++threadID}`,
  versions: ['3.25'],
  video: `https://www.youtube.com/watch?v=${videoID}`,
  videothumb: { '480w': oldThumbnail },
})

const collection = (builds: Build[]): BuildsData => ({
  currentVersion,
  versions: [
    { version: currentVersion, name: 'Current' },
    { version: '3.26', name: 'Previous' },
    { version: '3.25', name: 'Older' },
    { version: '3.24', name: 'Historical' },
  ],
  types: { melee: 'Melee', ranged: 'Ranged' },
  buildList: [
    { type: 'melee', builds },
    { type: 'ranged', builds: [] },
  ],
})

const writeCollection = (data: BuildsData) => {
  const { currentVersion: version, versions, ...buildData } = data
  writeFileSync(path.join(collectionPath, 'versions.json'), JSON.stringify({ currentVersion: version, versions }))
  writeFileSync(path.join(collectionPath, `data-${version.replaceAll('.', '-')}.json`), JSON.stringify(buildData))
}

const videoResult = (url = thumbnail) => ({ items: [{ snippet: { thumbnails: { high: { url } } } }] })

test('live edits survive delayed sync without stale field writeback', async ({ page, sync }) => {
  const data = collection(
    ['edited', 'deleted', 'moved', 'url', 'versions', 'video', 'thumbnail', 'unchanged', 'failed'].map(build),
  )
  const failed = data.buildList[0].builds.at(-1)
  if (!failed) {
    throw new Error('Missing failed build fixture')
  }

  failed.video = 'https://www.youtube.com/watch?v=FailedVideo'
  const gate = deferred()
  sync.control.guideGate = gate.promise
  sync.control.videoGate = gate.promise
  for (const item of data.buildList[0].builds) {
    sync.control.titles.set(item.url, '[3.26.1] Updated guide')
  }

  sync.control.videoResults.set(videoID, videoResult())
  sync.control.guideErrors.set(failed.url, new Error('Controlled guide failure'))
  sync.control.videoErrors.set('FailedVideo', new Error('Controlled video failure'))
  await sync.open(data)
  const running = page.evaluate(() => syncHarness.run())
  await expect.poll(() => sync.control.requestedIDs.length).toBe(data.buildList[0].builds.length)
  await page.evaluate(() => {
    const [melee, ranged] = syncHarness.data.buildList
    const findLive = (title: string) => {
      const item = melee.builds.find((candidate) => candidate.title === title)
      if (!item) {
        throw new Error(`Missing live fixture ${title}`)
      }

      return item
    }

    findLive('edited').title = 'Manual title'
    findLive('Manual title').author = 'Manual author'
    melee.builds.splice(
      melee.builds.findIndex((item) => item.title === 'deleted'),
      1,
    )
    const movedIndex = melee.builds.findIndex((item) => item.title === 'moved')
    ranged.builds.push(melee.builds.splice(movedIndex, 1)[0])
    findLive('url').url = 'https://example.com/manual-url'
    findLive('versions').versions = ['3.24']
    findLive('video').video = 'https://www.youtube.com/watch?v=ManualVideo'
    findLive('thumbnail').videothumb = { '480w': 'https://example.com/manual-thumbnail.jpg' }
    melee.builds.push({ title: 'Added during sync', url: 'https://example.com/added', versions: ['3.26.1'] })
  })
  gate.resolve(undefined)
  await running
  const result = await page.evaluate(() => ({ data: syncHarness.data, logs: syncHarness.logs() }))
  const all = result.data.buildList.flatMap((category) => category.builds)
  const find = (title: string) => {
    const item = all.find((candidate) => candidate.title === title)
    if (!item) {
      throw new Error(`Missing result fixture ${title}`)
    }

    return item
  }

  expect(all.map((item) => item.title)).not.toContain('deleted')
  expect(all.map((item) => item.title)).not.toContain('edited')
  expect(find('Manual title')).toMatchObject({ author: 'Manual author', versions: ['3.25', currentVersion] })
  expect(find('Added during sync')).toEqual({
    title: 'Added during sync',
    url: 'https://example.com/added',
    versions: [currentVersion],
  })
  expect(result.data.buildList.find((category) => category.type === 'ranged')?.builds).toEqual([
    expect.objectContaining({ title: 'moved', versions: ['3.25', currentVersion], videothumb: { '480w': thumbnail } }),
  ])
  expect(find('url')).toMatchObject({
    url: 'https://example.com/manual-url',
    versions: ['3.25'],
    videothumb: { '480w': oldThumbnail },
  })
  expect(all.filter((item) => item.title === 'url')).toHaveLength(1)
  expect(find('versions')).toMatchObject({ versions: ['3.24'], videothumb: { '480w': thumbnail } })
  expect(find('video')).toMatchObject({
    video: 'https://www.youtube.com/watch?v=ManualVideo',
    videothumb: { '480w': oldThumbnail },
  })
  expect(find('thumbnail').videothumb).toEqual({ '480w': 'https://example.com/manual-thumbnail.jpg' })
  expect(find('unchanged')).toMatchObject({ versions: ['3.25', currentVersion], videothumb: { '480w': thumbnail } })
  expect(find('failed')).toEqual(failed)
  expect(result.logs).toEqual(
    expect.arrayContaining([
      expect.stringContaining('Controlled guide failure'),
      expect.stringContaining('Controlled video failure'),
    ]),
  )
})

test('single sync guards direct double invocation until the guide lookup settles', async ({ page, sync }) => {
  const item = build('direct')
  delete item.video
  delete item.videothumb
  sync.control.titles.set(item.url, '[3.26] Guide')
  const guide = deferred()
  sync.control.guideGate = guide.promise
  await sync.open(collection([item]))
  const running = page.evaluate(async () => {
    await Promise.all([syncHarness.run(), syncHarness.run()])
  })
  await expect.poll(() => sync.control.guideRequests).toEqual([item.url])
  expect(await page.evaluate(() => syncHarness.busy())).toBe(true)
  await page.evaluate(() => syncHarness.run())
  expect(sync.control.guideRequests).toEqual([item.url])
  expect(await page.evaluate(() => syncHarness.busy())).toBe(true)
  guide.resolve(undefined)
  await running
  expect(await page.evaluate(() => syncHarness.busy())).toBe(false)
  expect(await page.evaluate(() => syncHarness.data.buildList[0].builds[0].versions)).toEqual(['3.25', '3.26'])
  await page.evaluate(() => syncHarness.run())
  expect(sync.control.guideRequests).toEqual([item.url, item.url])
})

for (const [stage, fail, reason] of [
  [
    'request',
    (sync: SyncHarness, url: string) => sync.control.guideErrors.set(url, new Error('Controlled request failure')),
    'Controlled request failure',
  ],
  ['HTTP', (sync: SyncHarness, url: string) => sync.control.guideResponses.set(url, { status: 503 }), 'HTTP 503'],
] as const) {
  test(`single sync recovers after a guide ${stage} failure`, async ({ page, sync }) => {
    const item = build('failure')
    delete item.video
    delete item.videothumb
    fail(sync, item.url)
    sync.control.titles.set(item.url, '[3.26.1] Recovered')
    await sync.open(collection([item]))
    await page.evaluate(() => syncHarness.run())
    const failed = await page.evaluate(() => ({
      busy: syncHarness.busy(),
      logs: syncHarness.logs(),
      versions: syncHarness.data.buildList[0].builds[0].versions,
    }))
    expect(failed.busy).toBe(false)
    expect(failed.versions).toEqual(['3.25'])
    expect(failed.logs).toEqual(expect.arrayContaining([expect.stringContaining(reason)]))
    sync.control.guideErrors.clear()
    sync.control.guideResponses.clear()
    await page.evaluate(() => syncHarness.run())
    expect(await page.evaluate(() => syncHarness.data.buildList[0].builds[0].versions)).toEqual([
      '3.25',
      currentVersion,
    ])
    expect(await page.evaluate(() => syncHarness.busy())).toBe(false)
  })
}

test('single sync disables the actual action until the guide lookup settles and after failure recovers', async ({
  page,
  sync,
}) => {
  const item = build('Visible starter')
  delete item.video
  delete item.videothumb
  writeCollection(collection([item]))
  const guide = deferred()
  sync.control.guideGate = guide.promise
  sync.control.guideErrors.set(item.url, new Error('Visible guide failure'))
  await sync.interceptApp()
  await page.goto('/')
  const button = page.getByRole('button', { name: 'Sync builds', exact: true })
  await expect(button).toBeEnabled()
  await button.evaluate((element) => {
    const action = element as HTMLButtonElement
    action.click()
    action.click()
  })
  await expect.poll(() => sync.control.guideRequests).toEqual([item.url])
  await expect(button).toBeDisabled()
  guide.resolve(undefined)
  await expect(page.getByText('Visible guide failure', { exact: false })).toBeVisible()
  await expect(button).toBeEnabled()
  expect(sync.control.guideRequests).toEqual([item.url])
})

test('optional video empty lookup removes the property and remains saveable after reload', async ({ page, sync }) => {
  const item = build('Missing video')
  item.versions = [currentVersion]
  writeCollection(collection([item]))
  await sync.interceptApp()
  await page.goto('/')
  const button = page.getByRole('button', { name: 'Sync builds', exact: true })
  await button.click()
  await expect(page.getByText('Sync complete', { exact: false })).toBeVisible()
  await expect(button).toBeEnabled()
  await expect(page.getByRole('article').getByRole('img')).toHaveCount(0)
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  const savedPath = path.join(collectionPath, 'data-3-26-1.json')
  await expect
    .poll(() => Object.hasOwn(JSON.parse(readFileSync(savedPath, 'utf8')).buildList[0].builds[0], 'video'))
    .toBe(false)
  const saved = JSON.parse(readFileSync(savedPath, 'utf8')).buildList[0].builds[0]
  expect(saved.videothumb ?? {}).toEqual({})
  expect(saved.title).toBe('Missing video')
  expect(saved.versions).toEqual([currentVersion])
  await page.reload()
  await page.getByRole('button', { name: 'Edit', exact: true }).click()
  await expect(page.getByLabel('Video URL', { exact: true })).toHaveValue('')
})

test('YouTube ID query ordering preserves correct thumbnails and unsupported lookups', async ({ page, sync }) => {
  const videos = [
    ['after', 'https://www.youtube.com/watch?v=After_ID-12&t=30'],
    ['before', 'https://www.youtube.com/watch?feature=shared&v=Before_ID-1'],
    ['correct', 'https://youtube.com/watch?v=Correct_ID1&t=30'],
    ['missing', 'https://www.youtube.com/watch?feature=shared'],
    ['empty', 'https://www.youtube.com/watch?v='],
    ['fragment', 'https://www.youtube.com/watch#v=FragmentID'],
    ['unsupported path', 'https://www.youtube.com/shorts/ShortsID'],
    ['unsupported host', 'https://youtube.com.example.invalid/watch?v=WrongHost'],
    ['unsupported value', 'https://www.youtube.com/watch?v=https%3A%2F%2Fexample.com'],
  ]
  const items = videos.map(([title, video]) => ({ ...build(title), versions: [currentVersion], video }))
  items[2].videothumb = { '480w': 'https://i.ytimg.com/vi/Correct_ID1/hqdefault.jpg' }
  sync.control.videoResults.set('After_ID-12', videoResult('https://i.ytimg.com/vi/After_ID-12/hqdefault.jpg'))
  sync.control.videoResults.set('Before_ID-1', videoResult('https://i.ytimg.com/vi/Before_ID-1/hqdefault.jpg'))
  await sync.open(collection(items))
  await page.evaluate(() => syncHarness.run())
  expect(sync.control.guideRequests).toEqual([])
  expect(sync.control.requestedIDs.toSorted()).toEqual(['After_ID-12', 'Before_ID-1'])
  const result = await page.evaluate(() => ({
    builds: syncHarness.data.buildList[0].builds,
    logs: syncHarness.logs(),
  }))
  expect(result.builds[0].videothumb).toEqual({ '480w': 'https://i.ytimg.com/vi/After_ID-12/hqdefault.jpg' })
  expect(result.builds[1].videothumb).toEqual({ '480w': 'https://i.ytimg.com/vi/Before_ID-1/hqdefault.jpg' })
  expect(result.builds.slice(2)).toEqual(items.slice(2))
  for (const item of items.slice(3)) {
    expect(result.logs).toEqual(expect.arrayContaining([expect.stringContaining(item.video)]))
  }
})

test('guide version token uses the real server title parser without truncating malformed tokens', async ({
  page,
  sync,
}) => {
  const titles = [
    ['multipart', '[3.26.1] Guide', '3.26.1'],
    ['ordinary', '[3.26] Guide', '3.26'],
    ['long multipart', '[3.26.1.2] Guide', ''],
    ['no version', 'Guide without a version', ''],
    ['trailing separator', '[3.26.] Guide', ''],
    ['double separator', '[3.26..1] Guide', ''],
    ['oversized minor', '[3.260] Guide', ''],
    ['oversized patch', '[3.26.123] Guide', ''],
    ['embedded major', '[13.26.1] Guide', ''],
    ['letter suffix', '[3.26.1beta] Guide', ''],
    ['malformed prefix', '[3..26] Guide', ''],
  ]
  const items = titles.map(([name, title]) => {
    const item = build(name)
    delete item.video
    delete item.videothumb
    sync.control.titles.set(item.url, title)
    return item
  })
  await sync.open(collection(items))
  await page.evaluate(() => syncHarness.run())
  const result = await page.evaluate(() => ({
    builds: syncHarness.data.buildList[0].builds,
    current: !syncHarness.outdated(syncHarness.data.buildList[0].builds[0].versions),
    logs: syncHarness.logs(),
  }))
  for (const [index, [, , version]] of titles.entries()) {
    expect(result.builds[index].versions).toEqual(version ? ['3.25', version] : ['3.25'])
    if (!version) {
      expect(result.logs).toEqual(expect.arrayContaining([expect.stringContaining(items[index].url)]))
    }
  }

  expect(result.current).toBe(true)
})

test('guide version token checks compatible builds and preserves all fields when no tag is found', async ({
  page,
  sync,
}) => {
  const item = build('Compatible guide without a version')
  item.videothumb = { '480w': thumbnail }
  const data = collection([item])
  data.versions[0].compatible = ['3.25']
  sync.control.titles.set(item.url, 'Guide without a supported version token')
  await sync.open(data)
  await page.evaluate(() => syncHarness.run())
  expect(await page.evaluate(() => syncHarness.data.buildList[0].builds[0])).toEqual(item)
  expect(await page.evaluate(() => syncHarness.logs())).toEqual(
    expect.arrayContaining([expect.stringContaining(item.url)]),
  )
})

const guidePage = (title: string, body = '') => `<html><head><title>${title}</title></head><body>${body}</body></html>`
const maxrollTags = (...tags: string[]) => tags.map((tag) => `<div class="_Tags__tag_gmlgk_1">${tag}</div>`).join('')

test('guide version outcomes use the real server parser with one request per supported guide URL', async ({
  page,
  sync,
}) => {
  const canonicalThread = 'https://www.pathofexile.com/forum/view-thread/3400007'
  const rows: Array<{
    title: string
    url: string
    versions?: string[]
    response?: { status?: number; html?: string; location?: string }
    tags: string[]
    log?: string
    request: boolean
  }> = [
    {
      title: 'forum prose title',
      url: 'https://www.pathofexile.com/forum/view-thread/3400001',
      response: {
        html: guidePage("Witch - What Wrecker's Playing for 3.27 | A Stress-Free Build - Forum - Path of Exile"),
      },
      tags: ['3.25', '3.27'],
      log: 'Updated',
      request: true,
    },
    {
      title: 'localized forum host',
      url: 'https://br.pathofexile.com/forum/view-thread/3451000',
      response: { html: guidePage('[3.29][Nerfed] Ivory Tower') },
      tags: ['3.25', '3.29'],
      log: 'Updated',
      request: true,
    },
    {
      title: 'PoE Vault title',
      url: 'https://www.poe-vault.com/guides/cyclone-slayer-build-guide',
      response: { html: guidePage('Cyclone Slayer Build Guide (PoE Curse of the Allflame 3.29) - PoE Vault') },
      tags: ['3.25', '3.29'],
      log: 'Updated',
      request: true,
    },
    {
      title: 'Maxroll tag badge',
      url: 'https://maxroll.gg/poe/build-guides/winter-orb-elementalist-league-starter',
      response: {
        html: guidePage(
          'Winter Orb Elementalist League Starter - POE Maxroll.gg',
          `${maxrollTags('Elementalist', 'Curse of the Allflame 3.29')}<p>Update for Patch 3.29.3</p>`,
        ),
      },
      tags: ['3.25', '3.29'],
      log: 'Updated',
      request: true,
    },
    {
      title: 'Maxroll title over badge',
      url: 'https://maxroll.gg/poe/build-guides/title-over-badge',
      response: {
        html: guidePage('Boneshatter Juggernaut 3.28 - POE Maxroll.gg', maxrollTags('Curse of the Allflame 3.29')),
      },
      tags: ['3.25', '3.28'],
      log: 'Updated',
      request: true,
    },
    {
      title: 'conflicting title',
      url: 'https://www.pathofexile.com/forum/view-thread/3400002',
      response: { html: guidePage('The Ultimate Uber Bosser (MSoZ) 3.27 - PoE 3.29 CotA Build Guide') },
      tags: ['3.25'],
      log: 'Ambiguous guide versions (3.27, 3.29)',
      request: true,
    },
    {
      title: 'repeated title version',
      url: 'https://www.pathofexile.com/forum/view-thread/3400003',
      response: { html: guidePage('[3.27] Guide updated for 3.27') },
      tags: ['3.25', '3.27'],
      log: 'Updated',
      request: true,
    },
    {
      title: 'already recorded tag',
      url: 'https://www.pathofexile.com/forum/view-thread/3400004',
      response: { html: guidePage('[3.25] Guide') },
      tags: ['3.25'],
      request: true,
    },
    ...[
      'https://maxroll.gg/poe/news/3-30-patch-notes',
      'https://maxroll.gg/poe2/build-guides/some-build',
      'https://mobalytics.gg/poe/builds/tesla-hierophant-3-27',
      'https://mobalytics.gg/poe/profile/fastaf/builds/the-ultimate-uber-bosser-msoz-3-27',
    ].map((url, index) => ({
      title: `unsupported route ${String.fromCodePoint(65 + index)}`,
      url,
      tags: ['3.25'],
      log: 'Unsupported',
      request: false,
    })),
    {
      title: 'unrelated host',
      url: 'https://example.com/guide?from=pathofexile.com',
      tags: ['3.25'],
      request: false,
    },
    {
      title: 'blocked guide',
      url: 'https://www.pathofexile.com/forum/view-thread/3400005',
      response: { status: 403, html: guidePage('[3.29] Guide') },
      tags: ['3.25'],
      log: 'HTTP 403',
      request: true,
    },
    {
      title: 'redirected guide',
      url: 'https://www.pathofexile.com/forum/view-thread/3400006',
      response: { status: 302, location: 'https://www.pathofexile.com/forum' },
      tags: ['3.25'],
      log: 'redirected',
      request: true,
    },
    {
      title: 'redirect to canonical host',
      url: 'https://pathofexile.com/forum/view-thread/3400007',
      response: { status: 301, location: canonicalThread },
      tags: ['3.25', '3.28'],
      log: 'Updated',
      request: true,
    },
  ]
  sync.control.titles.set(canonicalThread, '[3.28] Canonical guide')
  const items = rows.map(({ title, url, versions = ['3.25'], response }): Build => {
    if (response) {
      sync.control.guideResponses.set(url, response)
    }

    return { title, url, versions: [...versions] }
  })
  await sync.open(collection(items))
  await page.evaluate(() => syncHarness.run())
  const result = await page.evaluate(() => ({
    builds: syncHarness.data.buildList[0].builds,
    logs: syncHarness.logs(),
  }))
  for (const [index, row] of rows.entries()) {
    expect(result.builds[index].versions, row.title).toEqual(row.tags)
    if (row.log) {
      expect(
        result.logs.filter((entry) => entry.includes(row.title)),
        row.title,
      ).toEqual(expect.arrayContaining([expect.stringContaining(row.log)]))
    }
  }

  expect(sync.control.guideRequests.toSorted()).toEqual(
    [canonicalThread, ...rows.filter((row) => row.request).map((row) => row.url)].toSorted(),
  )
})

test('guide version lookups keep at most two requests in flight per host', async ({ page, sync }) => {
  const forum = ['A', 'B', 'C', 'D', 'E'].map((name) => build(`forum ${name}`))
  const maxroll: Build = {
    title: 'maxroll',
    url: 'https://maxroll.gg/poe/build-guides/per-host-limit',
    versions: ['3.25'],
  }
  const items = [...forum, maxroll]
  for (const item of items) {
    delete item.video
    delete item.videothumb
  }

  const guide = deferred()
  sync.control.guideGate = guide.promise
  await sync.open(collection(items))
  const running = page.evaluate(() => syncHarness.run())
  const inFlight = () => {
    const forumCount = sync.control.guideRequests.filter(
      (url) => new URL(url).hostname === 'www.pathofexile.com',
    ).length
    return { forum: forumCount, maxroll: sync.control.guideRequests.length - forumCount }
  }

  await expect.poll(inFlight).toEqual({ forum: 2, maxroll: 1 })
  // Absence of a third forum request can only be observed over time.
  await page.waitForTimeout(250)
  expect(inFlight()).toEqual({ forum: 2, maxroll: 1 })
  guide.resolve(undefined)
  await running
  expect(sync.control.guideRequests.toSorted()).toEqual(items.map((item) => item.url).toSorted())
})
