import type { GuideVersion } from '../src/lib/BuildsProcessing/guideSource.ts'
import type { BuildsData } from '../src/lib/schema/BuildsData.schema.ts'
import type { Page, Route } from '@playwright/test'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'node:path'
import { createServer } from 'vite'

declare global {
  const syncHarness: {
    data: BuildsData
    run: () => Promise<void>
    busy: () => boolean
    logs: () => string[]
    outdated: (versions: string[]) => boolean
    mountEditor: (buildUrl: string) => Promise<void>
  }
}

type GuideResponse = { status?: number; html?: string; location?: string }

type SyncControl = {
  guideRequests: string[]
  requestedIDs: string[]
  titles: Map<string, string>
  guideResponses: Map<string, GuideResponse>
  videoResults: Map<string, unknown>
  guideErrors: Map<string, Error>
  videoErrors: Map<string, Error>
  guideGate?: Promise<void>
  videoGate?: Promise<void>
  videoGates: Map<string, Array<Promise<void>>>
}

export type SyncHarness = {
  control: SyncControl
  open: (data: BuildsData) => Promise<void>
  interceptApp: () => Promise<void>
  close: () => Promise<void>
}

export const deferred = () => Promise.withResolvers<undefined>()

// SvelteKit's error() throws an HttpError, which is not an Error and keeps its text in body.message.
const errorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : ((error as undefined | { body?: { message?: string } })?.body?.message ?? String(error))

export const createSyncHarness = async (page: Page) => {
  const control: SyncControl = {
    guideRequests: [],
    requestedIDs: [],
    titles: new Map(),
    guideResponses: new Map(),
    videoResults: new Map(),
    guideErrors: new Map(),
    videoErrors: new Map(),
    videoGates: new Map(),
  }
  const shutdown = Promise.withResolvers<undefined>()
  const previousFetch = globalThis.fetch
  const setFetch = (value: typeof fetch) => {
    globalThis.fetch = value
  }

  const guideFetch: typeof fetch = async (input, init) => {
    const url = input instanceof Request ? input.url : String(input)
    if (['127.0.0.1', 'localhost'].includes(new URL(url).hostname)) {
      return previousFetch(input, init)
    }

    control.guideRequests.push(url)
    await Promise.race([control.guideGate, shutdown.promise])
    const failure = control.guideErrors.get(url)
    if (failure) {
      throw failure
    }

    const {
      status = 200,
      html = `<html><head><title>${control.titles.get(url) ?? ''}</title></head><body></body></html>`,
      location,
    } = control.guideResponses.get(url) ?? {}
    return new Response(html, { status, headers: location ? { location } : {} })
  }

  const entry = `
    import { buildsData } from '#lib/BuildsData.svelte.ts'
    import { updateBuilds } from '#lib/BuildsProcessing/updateBuilds.svelte.ts'
    import { log, syncInProgress } from '#lib/stores.ts'
    import { isOutdatedBuild } from '#lib/BuildsProcessing/isOutdatedBuild.ts'
    import { get } from 'svelte/store'
    import { mount } from 'svelte'
    import BuildEditModal from '#lib/components/BuildEditModal.svelte'
    window.syncHarness = {
      data: buildsData, run: updateBuilds,
      busy: () => get(syncInProgress),
      logs: () => [...get(log).values()],
      outdated: versions => isOutdatedBuild(versions, false),
      mountEditor: async buildUrl => {
        mount(BuildEditModal, { target: document.body, props: { modalOpen: true, buildType: 'melee', buildUrl } })
      },
    }
  `
  const server = await createServer({
    configFile: false,
    cacheDir: '.svelte-kit/sync-test-cache',
    root: process.cwd(),
    appType: 'custom',
    logLevel: 'error',
    resolve: { alias: { '#lib': path.resolve('src/lib') } },
    server: { host: '127.0.0.1', port: 0 },
    plugins: [
      {
        name: 'sync-test-boundaries',
        enforce: 'pre',
        resolveId(id, _importer, options) {
          if (id === 'virtual:sync-entry' || id === '$app/server') {
            return '\0sync-test:' + id
          }

          if (id.endsWith('/api/getGuideVersion.remote.ts') && !options?.ssr) {
            return '\0sync-test:guide-client'
          }

          if (id.endsWith('/api/getYouTubeData.remote.ts') && !options?.ssr) {
            return '\0sync-test:video-client'
          }

          return null
        },
        load(id) {
          if (id === '\0sync-test:virtual:sync-entry') {
            return entry
          }

          if (id === '\0sync-test:$app/server') {
            return 'export const command = (schema, handler) => input => handler(schema.parse(input))'
          }

          const command = id === '\0sync-test:guide-client' ? 'getGuideVersion' : 'getYouTubeData'
          if (id === '\0sync-test:guide-client' || id === '\0sync-test:video-client') {
            return `export const ${command} = async input => {
              const response = await fetch('/__sync-control/${command}', {method: 'POST', body: JSON.stringify(input)})
              const value = await response.json()
              if (!response.ok) throw new Error(value.message)
              return value
            }`
          }

          return null
        },
        configureServer(vite) {
          vite.middlewares.use('/__sync-harness', async (_request, response, next) => {
            try {
              const html = await vite.transformIndexHtml(
                '/__sync-harness',
                '<!doctype html><script type="module" src="/@id/__x00__sync-test:virtual:sync-entry"></script>',
              )
              response.setHeader('Content-Type', 'text/html')
              response.end(html)
            } catch (error) {
              next(error)
            }
          })
        },
      },
      svelte({ configFile: false }),
    ],
  })
  setFetch(guideFetch)

  try {
    const { parse, stringify } = (await server.ssrLoadModule('devalue')) as {
      parse: (value: string) => unknown
      stringify: (value: unknown) => string
    }
    const { getGuideVersion } = (await server.ssrLoadModule(path.resolve('src/lib/api/getGuideVersion.remote.ts'))) as {
      getGuideVersion: (guideUrl: string) => Promise<GuideVersion>
    }
    const video = async (id: string) => {
      control.requestedIDs.push(id)
      const gate = control.videoGates.get(id)?.shift() ?? control.videoGate
      await Promise.race([gate, shutdown.promise])
      const failure = control.videoErrors.get(id)
      if (failure) {
        throw failure
      }

      return control.videoResults.get(id) ?? { items: [] }
    }

    await server.listen()
    const address = server.resolvedUrls?.local[0]
    if (!address) {
      throw new Error('Sync harness server has no local address')
    }

    await page.route(address + '**', (route) => route.continue())
    await page.route('**/__sync-control/*', async (route) => {
      try {
        const input = route.request().postDataJSON()
        const value = route.request().url().endsWith('/getGuideVersion')
          ? await getGuideVersion(input)
          : await video(input)
        await route.fulfill({ json: value })
      } catch (error) {
        await route.fulfill({ status: 500, json: { message: errorMessage(error) } })
      }
    })

    const url = address + '__sync-harness'
    return {
      control,
      open: async (data: BuildsData) => {
        await page.goto(url)
        await page.waitForFunction(() => typeof syncHarness !== 'undefined')
        await page.evaluate((input) => Object.assign(syncHarness.data, input), data)
      },
      interceptApp: async () => {
        await page.route('**/_app/remote/**', async (route: Route) => {
          // Command URLs end in /_app/remote/<hash>/<function name>.
          const name = new URL(route.request().url()).pathname.split('/').at(-1)
          if (route.request().method() !== 'POST' || (name !== 'getGuideVersion' && name !== 'getYouTubeData')) {
            await route.fallback()
            return
          }

          const body = route.request().postDataJSON()
          const input = parse(Buffer.from(body.payload, 'base64url').toString('utf8')) as string
          try {
            const value = name === 'getGuideVersion' ? await getGuideVersion(input) : await video(input)
            await route.fulfill({ json: { type: 'result', data: stringify({ _: value }) } })
          } catch (error) {
            await route.fulfill({
              status: 500,
              json: { type: 'error', error: { message: errorMessage(error) } },
            })
          }
        })
      },
      close: async () => {
        shutdown.resolve(undefined)
        try {
          await server.close()
        } finally {
          setFetch(previousFetch)
        }
      },
    }
  } catch (error) {
    try {
      await server.close()
    } finally {
      setFetch(previousFetch)
    }

    throw error
  }
}
