import type { YouTubeItem } from '#lib/api/getYouTubeData.remote.ts'
import type { Build } from '#lib/schema/Build.schema.ts'
import type { BuildList } from '#lib/schema/BuildsData.schema.ts'

export type BuildCandidate = { build: Build; category: string; reason: string }
export type IntakeChoice =
  | { kind: 'manual'; url: string }
  | { kind: 'new'; url: string; video: YouTubeItem }
  | { kind: 'replace'; url: string; video: YouTubeItem; originalUrl: string }

const shortPathPattern = /^\/([^/]+)\/?$/u
const videoPathPattern = /^\/(?:shorts|embed)\/([^/]+)\/?$/u
const videoIdPattern = /^[\w-]{11}$/u
const wordSeparatorPattern = /[^\p{L}\p{N}]+/gu

export const getYouTubeVideoId = (input: string): null | string => {
  try {
    const url = new URL(input)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port) {
      return null
    }

    let id: null | string = null
    if (url.hostname === 'youtu.be') {
      id = shortPathPattern.exec(url.pathname)?.[1] ?? null
    } else if (['m.youtube.com', 'www.youtube.com', 'youtube.com'].includes(url.hostname)) {
      id = url.pathname === '/watch' ? url.searchParams.get('v') : (videoPathPattern.exec(url.pathname)?.[1] ?? null)
    }

    return id && videoIdPattern.test(id) ? id : null
  } catch {
    return null
  }
}

const normalize = (value: string) => value.normalize('NFKD').toLowerCase().replaceAll(wordSeparatorPattern, ' ').trim()
const compact = (value: string) => normalize(value).replaceAll(' ', '')

const authorSimilarity = (left: string, right: string): number => {
  const a = compact(left)
  const b = compact(right)
  if (!a || !b) {
    return 0
  }

  if (a === b) {
    return 1
  }

  if (Math.min(a.length, b.length) >= 4 && (a.includes(b) || b.includes(a))) {
    return 0.8
  }

  const pairs = (value: string) =>
    new Set(Array.from({ length: value.length - 1 }, (_, index) => value.slice(index, index + 2)))
  const aPairs = pairs(a)
  const bPairs = pairs(b)
  const shared = [...aPairs].filter((pair) => bPairs.has(pair)).length
  return aPairs.size + bPairs.size ? (2 * shared) / (aPairs.size + bPairs.size) : 0
}

const titleSimilarity = (left: string, right: string): number => {
  const words = (value: string) =>
    new Set(
      normalize(value)
        .split(' ')
        .filter((word) => word.length > 2),
    )
  const a = words(left)
  const b = words(right)
  const shared = [...a].filter((word) => b.has(word)).length
  return Math.min(a.size, b.size) ? shared / Math.min(a.size, b.size) : 0
}

export const similarAuthors = (author: string, savedAuthors: Iterable<string>): string[] =>
  Array.from(new Set(savedAuthors), (name) => ({ name, score: authorSimilarity(author, name) }))
    .filter(({ name, score }) => name !== author && score >= 0.5)
    .toSorted((a, b) => b.score - a.score)
    .map(({ name }) => name)

export const suggestBuilds = (buildList: BuildList, video: YouTubeItem): BuildCandidate[] =>
  buildList
    .flatMap((category) =>
      category.builds.map((build) => {
        const author = authorSimilarity(build.author ?? '', video.snippet.channelTitle)
        const title = titleSimilarity(build.title, video.snippet.title)
        const reasons = []
        if (author >= 0.5) {
          reasons.push('Similar author/channel name')
        }

        if (title > 0) {
          reasons.push('Shared title terms')
        }

        return {
          build,
          category: category.type,
          reason: reasons.join(' and '),
          score: (author >= 0.5 ? author : 0) + title,
        }
      }),
    )
    .filter(({ reason }) => reason !== '')
    .toSorted((a, b) => b.score - a.score)
    .map(({ build, category, reason }) => ({ build, category, reason }))

export const searchBuilds = (buildList: BuildList, query: string): BuildCandidate[] => {
  const terms = normalize(query).split(' ').filter(Boolean)
  return buildList.flatMap((category) =>
    category.builds
      .filter((build) => {
        const text = normalize(`${build.title} ${build.author ?? ''} ${build.url}`)
        return terms.every((term) => text.includes(term))
      })
      .map((build) => ({
        build,
        category: category.type,
        reason: terms.length ? 'Matches collection search' : 'Saved build',
      })),
  )
}

const videoThumbnails = (video: YouTubeItem): NonNullable<Build['videothumb']> => {
  const { high, standard, maxres } = video.snippet.thumbnails
  return {
    ...(high ? { '480w': high.url } : {}),
    ...(standard ? { '640w': standard.url } : {}),
    ...(maxres ? { '1280w': maxres.url } : {}),
  }
}

export const replacementDraft = (
  original: Build,
  videoUrl: string,
  video: YouTubeItem,
  currentVersion: string,
): Build => {
  const oldVideoId = getYouTubeVideoId(original.video ?? original.url)
  const guideVideoId = getYouTubeVideoId(original.url)
  return {
    ...original,
    ...(original.tags ? { tags: [...original.tags] } : {}),
    url: oldVideoId && guideVideoId === oldVideoId ? videoUrl : original.url,
    video: videoUrl,
    videothumb: videoThumbnails(video),
    versions: [...new Set([...original.versions, currentVersion])],
  }
}

export const newBuildDraft = (videoUrl: string, video: YouTubeItem, currentVersion: string): Build => ({
  title: video.snippet.title,
  author: video.snippet.channelTitle,
  url: videoUrl,
  video: videoUrl,
  videothumb: videoThumbnails(video),
  versions: [currentVersion],
})
