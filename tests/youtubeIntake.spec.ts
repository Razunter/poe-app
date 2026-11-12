import type { YouTubeData, YouTubeItem } from '../src/lib/api/getYouTubeData.remote.ts'
import {
  getYouTubeVideoId,
  newBuildDraft,
  replacementDraft,
  searchBuilds,
  similarAuthors,
  suggestBuilds,
} from '../src/lib/BuildsProcessing/youtubeIntake.ts'
import type { Build } from '../src/lib/schema/Build.schema.ts'
import type { BuildList } from '../src/lib/schema/BuildsData.schema.ts'
import { expect, test } from '@playwright/test'
import path from 'node:path'
import { createServer } from 'vite'

const oldId = 'ZxXjPVJQyk8'
const newId = 'fjCN-vN_Tvk'
const videoUrl = `https://www.youtube.com/watch?v=${newId}`
const video: YouTubeItem = {
  id: newId,
  snippet: {
    title: 'Flicker strike league starter',
    channelTitle: 'MAGEFIST',
    thumbnails: {
      high: { url: `https://i.ytimg.com/vi/${newId}/hqdefault.jpg` },
      maxres: { url: `https://i.ytimg.com/vi/${newId}/maxresdefault.jpg` },
    },
  },
}
const savedBuild = (overrides: Partial<Build> = {}): Build => ({
  title: 'Curated old guide',
  author: 'Mage Fist',
  url: `https://www.youtube.com/watch?v=${oldId}&t=30`,
  video: `https://youtu.be/${oldId}`,
  versions: ['3.28', '3.29'],
  tags: ['curated', 'budget'],
  pin: true,
  skip: true,
  videothumb: { '480w': `https://i.ytimg.com/vi/${oldId}/hqdefault.jpg` },
  ...overrides,
})

for (const url of [
  `https://www.youtube.com/watch?t=30&v=${oldId}`,
  `http://youtube.com/watch?v=${oldId}`,
  `https://m.youtube.com/watch?v=${oldId}`,
  `https://youtu.be/${oldId}?t=30`,
  `https://www.youtube.com/shorts/${oldId}`,
  `https://youtube.com/embed/${oldId}/`,
]) {
  test(`YouTube parser accepts ${url}`, () => {
    expect(getYouTubeVideoId(url)).toBe(oldId)
  })
}

for (const url of [
  'not a URL',
  `ftp://youtube.com/watch?v=${oldId}`,
  `https://youtube.com.evil.test/watch?v=${oldId}`,
  `https://youtube.com@evil.test/watch?v=${oldId}`,
  `https://user@youtube.com/watch?v=${oldId}`,
  `https://youtube.com:8443/watch?v=${oldId}`,
  `https://youtu.be/${oldId}/extra`,
  'https://youtube.com/watch?v=short',
  `https://youtube.com/watch?v=${oldId}%26key=other`,
]) {
  test(`YouTube parser rejects ${url}`, () => {
    expect(getYouTubeVideoId(url)).toBeNull()
  })
}

test('suggestions use independent author and title clues with deterministic ranking', () => {
  const both = savedBuild({ title: 'Flicker strike starter', url: 'https://guides.test/both' })
  const authorOnly = savedBuild({ title: 'Unrelated curated heading', url: 'https://guides.test/author' })
  const titleOnly = savedBuild({
    author: 'Someone Else',
    title: 'Flicker strike starter',
    url: 'https://guides.test/title',
  })
  const unrelated = savedBuild({ author: 'Other', title: 'Summoner handbook', url: 'https://guides.test/unrelated' })
  const collection: BuildList = [
    { type: 'melee', builds: [authorOnly, both] },
    { type: 'other', builds: [titleOnly, unrelated] },
  ]
  const candidates = suggestBuilds(collection, video)
  expect(candidates.map(({ build }) => build.url)).toEqual([both.url, authorOnly.url, titleOnly.url])
  expect(candidates[0].reason).toContain('author')
  expect(candidates[0].reason).toContain('title')
  expect(candidates[1].category).toBe('melee')
  expect(suggestBuilds(collection, video)).toEqual(candidates)
})

test('similar authors account for spacing, punctuation, case and approximate spelling without assigning a name', () => {
  expect(
    similarAuthors('MAGEFIST', ['Mage Fist', 'Mage-Fist', 'Magefist Builds', 'Magefisst', 'Other', 'Mage Fist']),
  ).toEqual(['Mage Fist', 'Mage-Fist', 'Magefisst', 'Magefist Builds'])
  expect(similarAuthors('', ['Mage Fist'])).toEqual([])
  expect(similarAuthors('Mage Fist', ['Mage Fist'])).toEqual([])
})

test('whole collection search reaches unsuggested entries by title, author or guide URL', () => {
  const hidden = savedBuild({
    title: 'Summoner handbook',
    author: 'Completely Different',
    url: 'https://written.test/unique-guide',
  })
  const collection: BuildList = [
    { type: 'first', builds: [savedBuild()] },
    { type: 'last', builds: [hidden] },
  ]
  expect(suggestBuilds(collection, video).some(({ build }) => build.url === hidden.url)).toBe(false)
  for (const query of ['SUMMONER', 'completely different', 'written.test/unique-guide']) {
    expect(searchBuilds(collection, query)).toEqual([
      { build: hidden, category: 'last', reason: 'Matches collection search' },
    ])
  }

  expect(searchBuilds(collection, '')).toHaveLength(2)
  expect(searchBuilds(collection, 'not in collection')).toEqual([])
})

test('replacement preserves curated values, matches guide video identity and detaches nested drafts', () => {
  const original = savedBuild()
  const before = structuredClone(original)
  const draft = replacementDraft(original, videoUrl, video, '3.30')
  expect(draft).toEqual({
    ...before,
    url: videoUrl,
    video: videoUrl,
    videothumb: {
      '480w': video.snippet.thumbnails.high?.url,
      '1280w': video.snippet.thumbnails.maxres?.url,
    },
    versions: ['3.28', '3.29', '3.30'],
  })
  draft.tags?.push('draft only')
  draft.versions.push('3.31')
  if (draft.videothumb) {
    draft.videothumb['480w'] = 'https://draft.test/image.jpg'
  }

  expect(original).toEqual(before)
  expect(video.snippet.thumbnails.high?.url).toContain(newId)
})

test('replacement preserves unrelated guides, deduplicates current version and clears absent thumbnails', () => {
  const withoutThumbnails: YouTubeItem = { ...video, snippet: { ...video.snippet, thumbnails: {} } }
  for (const url of ['https://written.test/guide', 'https://youtu.be/Abc_123-XYZ']) {
    const original = savedBuild({ url, versions: ['3.28', '3.30', '3.30'] })
    const draft = replacementDraft(original, videoUrl, withoutThumbnails, '3.30')
    expect(draft.url).toBe(url)
    expect(draft.versions).toEqual(['3.28', '3.30'])
    expect(draft.videothumb).toEqual({})
    expect(original.videothumb).not.toEqual({})
  }
})

test('a primary video guide without an optional video is replaced by identity', () => {
  const original = savedBuild({ video: undefined })
  expect(replacementDraft(original, videoUrl, video, '3.30').url).toBe(videoUrl)
})

test('new draft prefills metadata and independent current-version defaults', () => {
  const first = newBuildDraft(videoUrl, video, '3.30')
  expect(first).toEqual({
    title: video.snippet.title,
    author: 'MAGEFIST',
    url: videoUrl,
    video: videoUrl,
    versions: ['3.30'],
    videothumb: {
      '480w': video.snippet.thumbnails.high?.url,
      '1280w': video.snippet.thumbnails.maxres?.url,
    },
  })
  first.versions.push('changed')
  expect(newBuildDraft(videoUrl, video, '3.30').versions).toEqual(['3.30'])
})

test('metadata command validates upstream data and bounds stalled requests and bodies without blocking later lookups', async () => {
  const server = await createServer({
    configFile: false,
    cacheDir: '.svelte-kit/youtube-intake-test-cache',
    root: process.cwd(),
    appType: 'custom',
    logLevel: 'error',
    ssr: { noExternal: ['wretch'] },
    plugins: [
      {
        name: 'youtube-command-boundaries',
        enforce: 'pre',
        resolveId(id) {
          if (['$app/env/private', '$app/server'].includes(id)) {
            return '\0youtube-test:' + id
          }

          return null
        },
        load(id) {
          if (id === '\0youtube-test:$app/server') {
            return 'export const command = (schema, handler) => input => handler(schema.parse(input))'
          }

          if (id === '\0youtube-test:$app/env/private') {
            return 'export const YOUTUBE_API_KEY = "test&key=value"'
          }

          return null
        },
      },
    ],
  })
  const originalFetch = globalThis.fetch
  const originalTimeout = AbortSignal.timeout
  const control: {
    urls: string[]
    result: unknown
    failure?: Error
    stall?: 'body' | 'fetch'
    started?: () => void
  } = { urls: [], result: undefined }
  try {
    globalThis.fetch = async (input, init) => {
      control.urls.push(String(input))
      if (control.failure) {
        throw control.failure
      }

      if (control.stall === 'fetch') {
        const { promise, reject } = Promise.withResolvers<Response>()
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true })
        control.started?.()
        return promise
      }

      if (control.stall === 'body') {
        return new Response(
          new ReadableStream({
            start(controller) {
              init?.signal?.addEventListener('abort', () => controller.error(init.signal?.reason), { once: true })
              control.started?.()
            },
          }),
        )
      }

      return Response.json(control.result)
    }

    const { getYouTubeData } = (await server.ssrLoadModule(path.resolve('src/lib/api/getYouTubeData.remote.ts'))) as {
      getYouTubeData: (input: unknown) => Promise<YouTubeData>
    }
    control.result = { items: [video] }
    for (const id of ['', 'short', `${newId}&key=attacker`, `https://youtu.be/${newId}`, 42, null]) {
      await expect(async () => getYouTubeData(id)).rejects.toThrow()
    }

    expect(control.urls).toEqual([])
    expect(await getYouTubeData(newId)).toEqual({ items: [video] })
    const request = new URL(control.urls[0])
    expect(request.origin + request.pathname).toBe('https://www.googleapis.com/youtube/v3/videos')
    expect([...request.searchParams]).toEqual([
      ['id', newId],
      ['key', 'test&key=value'],
      ['part', 'snippet'],
    ])
    for (const result of [
      {},
      { items: [{}] },
      { items: [{ ...video, id: oldId }] },
      { items: [{ ...video, snippet: { ...video.snippet, title: '' } }] },
      { items: [{ ...video, snippet: { ...video.snippet, channelTitle: 42 } }] },
      { items: [{ ...video, snippet: { ...video.snippet, thumbnails: { high: { url: 'ftp://image.test/a' } } } }] },
      {
        items: [
          { ...video, snippet: { ...video.snippet, thumbnails: { high: { url: 'https://image.test/a', width: -1 } } } },
        ],
      },
    ]) {
      control.result = result
      await expect(getYouTubeData(newId)).rejects.toMatchObject({ status: 500 })
    }

    control.result = { items: [{ id: newId, snippet: { title: 'Valid', channelTitle: 'Channel' } }] }
    expect((await getYouTubeData(newId)).items[0].snippet.thumbnails).toEqual({})
    Object.assign(control, { result: { items: [] } })
    expect(await getYouTubeData(newId)).toEqual({ items: [] })
    Object.assign(control, { failure: new Error('Upstream unavailable') })
    await expect(getYouTubeData(newId)).rejects.toMatchObject({ status: 500 })
    Object.assign(control, { failure: undefined })
    for (const stall of ['fetch', 'body'] as const) {
      const deadline = new AbortController()
      const timeouts: number[] = []
      AbortSignal.timeout = (milliseconds) => {
        timeouts.push(milliseconds)
        return deadline.signal
      }

      control.stall = stall
      const started = Promise.withResolvers<undefined>()
      control.started = () => started.resolve(undefined)
      const expired = Promise.withResolvers<never>()
      const watchdog = setTimeout(
        () => expired.reject(new Error('YouTube lookup did not settle after its deadline')),
        1_000,
      )
      const lookup = Promise.race([getYouTubeData(newId), expired.promise])
      try {
        await Promise.race([started.promise, expired.promise])
        deadline.abort(new DOMException('Deadline exceeded', 'TimeoutError'))
        await expect(lookup).rejects.toMatchObject({
          status: 500,
          body: { message: 'YouTube metadata lookup failed' },
        })
        expect(timeouts).toEqual([15_000])
      } finally {
        clearTimeout(watchdog)
        deadline.abort()
      }

      control.stall = undefined
      control.started = undefined
      AbortSignal.timeout = originalTimeout
      control.result = { items: [video] }
      expect(await getYouTubeData(newId)).toEqual({ items: [video] })
    }
  } finally {
    Object.assign(globalThis, { fetch: originalFetch })
    Object.assign(AbortSignal, { timeout: originalTimeout })
    await server.close()
  }
})
