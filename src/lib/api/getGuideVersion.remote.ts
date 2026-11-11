import { classifyGuideUrl, type GuideVersion } from '#lib/BuildsProcessing/guideSource.ts'
import { command } from '$app/server'
import { error } from '@sveltejs/kit'
import * as z from 'zod'

const versionRegex = /(?<![\w.])3\.\d{1,2}(?:\.\d{1,2})?(?![\w.])/gu
const titleRegex = /<title\b[^>]*>([^<]*)/iu
const maxRequestsPerHost = 2
const maxRedirects = 3

const hostSlots = new Map<string, { active: number; waiting: Array<(value: undefined) => void> }>()

const withHostSlot = async <T>(host: string, task: () => Promise<T>) => {
  const slot = hostSlots.get(host) ?? { active: 0, waiting: [] }
  hostSlots.set(host, slot)

  if (slot.active < maxRequestsPerHost) {
    slot.active++
  } else {
    // A released slot is handed to the waiter directly, so `active` stays unchanged.
    const { promise, resolve } = Promise.withResolvers<undefined>()
    slot.waiting.push(resolve)
    await promise
  }

  try {
    return await task()
  } finally {
    const next = slot.waiting.shift()
    if (next) {
      next(undefined)
    } else if (--slot.active === 0) {
      hostSlots.delete(host)
    }
  }
}

const requestFailed = (cause: unknown) =>
  error(502, `Guide request failed: ${cause instanceof Error ? cause.message : String(cause)}`)

const versionFrom = (texts: string[]): GuideVersion => {
  const versions = [...new Set(texts.flatMap((text) => text.match(versionRegex) ?? []))]

  if (versions.length === 1) {
    return { outcome: 'found', version: versions[0] }
  }

  return versions.length > 1 ? { outcome: 'ambiguous', versions } : { outcome: 'missing' }
}

export const getGuideVersion = command(z.httpUrl(), async (guideUrl): Promise<GuideVersion> => {
  const guide = classifyGuideUrl(guideUrl)
  if (!guide?.supported) {
    error(400, 'Unsupported guide URL')
  }

  const html = await withHostSlot(new URL(guideUrl).hostname, async () => {
    const signal = AbortSignal.timeout(15_000)
    let url = guideUrl
    for (let redirects = 0; redirects <= maxRedirects; redirects++) {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'PoE-Starters-Collection-Editor (guide version check)' },
        // Followed by hand so no request leaves the supported guide routes.
        redirect: 'manual',
        signal,
      }).catch(requestFailed)
      const location = response.headers.get('location')

      if (response.status >= 300 && response.status < 400 && location) {
        await response.body?.cancel()
        url = new URL(location, url).href
        const destination = classifyGuideUrl(url)
        if (!destination?.supported || destination.source !== guide.source) {
          error(502, 'Guide redirected to an unsupported page')
        }
      } else if (response.ok) {
        return response.text().catch(requestFailed)
      } else {
        await response.body?.cancel()
        error(502, `Guide responded with HTTP ${response.status}`)
      }
    }

    return error(502, 'Guide redirected too many times')
  })

  const titleVersion = versionFrom([titleRegex.exec(html)?.[1] ?? ''])
  if (titleVersion.outcome !== 'missing' || !guide.source.label) {
    return titleVersion
  }

  return versionFrom(Array.from(html.matchAll(guide.source.label), (match) => match[1]))
})
