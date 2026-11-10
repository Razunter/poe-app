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

type ProxyInput = { mode?: string; targetUrl?: string }
type ProxyCommand = (input: ProxyInput) => Promise<string>

type SyncControl = {
  starts: number
  closing: number[]
  closed: number[]
  requestedIDs: string[]
  titles: Map<string, string>
  videoResults: Map<string, unknown>
  guideErrors: Map<string, Error>
  videoErrors: Map<string, Error>
  startGate?: Promise<void>
  guideGate?: Promise<void>
  videoGate?: Promise<void>
  closeGate?: Promise<void>
  startError?: Error
  closeError?: Error
}

export type SyncHarness = {
  control: SyncControl
  open: (data: BuildsData) => Promise<void>
  interceptApp: () => Promise<void>
  close: () => Promise<void>
}

export const deferred = () => Promise.withResolvers<undefined>()

export const createSyncHarness = async (page: Page) => {
  const control: SyncControl = {
    starts: 0,
    closing: [],
    closed: [],
    requestedIDs: [],
    titles: new Map(),
    videoResults: new Map(),
    guideErrors: new Map(),
    videoErrors: new Map(),
  }
  const shutdown = Promise.withResolvers<undefined>()
  const globals = globalThis as typeof globalThis & { __poeSyncLaunch?: () => Promise<unknown> }
  const previousLaunch = globals.__poeSyncLaunch
  // The fixture owns this SSR launch hook until its server is closed.
  const setLaunch = (value: typeof previousLaunch) => {
    globals.__poeSyncLaunch = value
  }

  const launch = async () => {
    const identity = ++control.starts
    await Promise.race([control.startGate, shutdown.promise])
    if (control.startError) {
      throw control.startError
    }

    return {
      newPage: async () => {
        let target = ''
        return {
          setRequestInterception: async () => undefined,
          on: () => undefined,
          setJavaScriptEnabled: async () => undefined,
          goto: async (url: string) => {
            target = url
            await Promise.race([control.guideGate, shutdown.promise])
            const failure = control.guideErrors.get(url)
            if (failure) {
              throw failure
            }

            return { ok: () => true }
          },
          title: async () => control.titles.get(target) ?? '',
        }
      },
      close: async () => {
        control.closing.push(identity)
        await Promise.race([control.closeGate, shutdown.promise])
        if (control.closeError) {
          throw control.closeError
        }

        control.closed.push(identity)
      },
    }
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
    ssr: { noExternal: ['puppeteer'] },
    plugins: [
      {
        name: 'sync-test-boundaries',
        enforce: 'pre',
        resolveId(id, _importer, options) {
          if (id === 'virtual:sync-entry' || id === '$app/server' || id === 'puppeteer') {
            return '\0sync-test:' + id
          }

          if (id.endsWith('/api/proxy.remote.ts') && !options?.ssr) {
            return '\0sync-test:proxy-client'
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

          if (id === '\0sync-test:puppeteer') {
            return 'export const launch = () => globalThis.__poeSyncLaunch()'
          }

          const command = id === '\0sync-test:proxy-client' ? 'proxy' : 'getYouTubeData'
          if (id === '\0sync-test:proxy-client' || id === '\0sync-test:video-client') {
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
  setLaunch(launch)

  try {
    const { parse, stringify } = (await server.ssrLoadModule('devalue')) as {
      parse: (value: string) => unknown
      stringify: (value: unknown) => string
    }
    const { proxy } = (await server.ssrLoadModule(path.resolve('src/lib/api/proxy.remote.ts'))) as {
      proxy: ProxyCommand
    }
    const video = async (id: string) => {
      control.requestedIDs.push(id)
      await Promise.race([control.videoGate, shutdown.promise])
      const failure = control.videoErrors.get(id)
      if (failure) {
        throw failure
      }

      return control.videoResults.get(id) ?? { items: [] }
    }

    await page.route('**/__sync-control/*', async (route) => {
      try {
        const input = route.request().postDataJSON()
        const value = route.request().url().endsWith('/proxy') ? await proxy(input) : await video(input)
        await route.fulfill({ json: value })
      } catch (error) {
        await route.fulfill({ status: 500, json: { message: error instanceof Error ? error.message : String(error) } })
      }
    })
    await server.listen()
    const address = server.resolvedUrls?.local[0]
    if (!address) {
      throw new Error('Sync harness server has no local address')
    }

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
          if (route.request().method() !== 'POST') {
            await route.fallback()
            return
          }

          const body = route.request().postDataJSON()
          const input = body.payload ? parse(Buffer.from(body.payload, 'base64url').toString('utf8')) : undefined
          if (
            typeof input !== 'string' &&
            (!input || typeof input !== 'object' || (!('mode' in input) && !('targetUrl' in input)))
          ) {
            await route.fallback()
            return
          }

          try {
            const value = typeof input === 'string' ? await video(input) : await proxy(input as ProxyInput)
            await route.fulfill({ json: { type: 'result', data: stringify({ _: value }) } })
          } catch (error) {
            await route.fulfill({
              status: 500,
              json: { type: 'error', error: { message: error instanceof Error ? error.message : String(error) } },
            })
          }
        })
      },
      close: async () => {
        shutdown.resolve(undefined)
        try {
          await server.close()
        } finally {
          setLaunch(previousLaunch)
        }
      },
    }
  } catch (error) {
    try {
      await server.close()
    } finally {
      setLaunch(previousLaunch)
    }

    throw error
  }
}
