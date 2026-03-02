import { getYouTubeData, type YouTubeData } from '$lib/api/getYouTubeData.remote.ts'
import { proxy } from '$lib/api/proxy.remote.ts'
import { buildsData } from '$lib/BuildsData.svelte.ts'
import { isOutdatedBuild } from '$lib/BuildsProcessing/isOutdatedBuild.ts'
import type { Build } from '$lib/schema/Build.schema.ts'
import { log, progressBar } from '$lib/stores.ts'

// Update build versions from PoE Forum & PoE-vault
const updateBuildVersions = async (build: Build) => {
  // Not outdated → nothing to do
  if (!isOutdatedBuild(build.versions, false)) {
    return build
  }

  // URL isn't supported → nothing to do
  if (
    !build.url.includes('pathofexile.com') &&
    // PoE Vault blocks requests
    // !build.url.includes('poe-vault.com') &&
    !build.url.includes('maxroll.gg')
  ) {
    return build
  }

  let versionResponse: string
  try {
    versionResponse = await proxy({ targetUrl: build.url })
  } catch (error) {
    log.update((log_) => {
      return log_.set(
        new Date(),
        'message' in error ? error.message + '\n' + build.title : String(error) + '\n' + build.title,
      )
    })

    return build
  }

  if (versionResponse === '') {
    log.update((log_) => {
      return log_.set(
        new Date(),
        `Build or version not found: <a href="${build.url}" target="_blank" rel="noopener">${build.title}</a>.`,
      )
    })
  } else if (!build.versions.includes(versionResponse)) {
    build.versions.push(versionResponse)
    log.update((log_) => {
      return log_.set(new Date(), `Updated: ${build.title}\n${build.url}`)
    })
  }

  return build
}

const updateBuildVideo = async (build: Build) => {
  if (build.video && build.video.indexOf('youtube.com') > 0) {
    const videoID = build.video.slice(Math.max(0, build.video.lastIndexOf('?v=') + 3))

    if (build.videothumb?.['480w'] && !build.videothumb['480w'].includes(videoID)) {
      build.videothumb = {}
    }

    if (!build.videothumb || Object.keys(build.videothumb).length === 0) {
      let YTdata: YouTubeData

      try {
        YTdata = await getYouTubeData(videoID)
      } catch (error) {
        // handle error
        log.update((log_) => {
          return log_.set(
            new Date(),
            (typeof error === 'object' && 'message' in error ? error.message : String(error)) + '\n' + build.title,
          )
        })

        return build
      }

      /* eslint-disable require-atomic-updates */
      if (YTdata.items.length > 0) {
        const thumbs = YTdata.items[0].snippet.thumbnails
        build.videothumb = {
          '480w': thumbs.high.url,
        }
        if (thumbs.standard) {
          build.videothumb['640w'] = thumbs.standard.url
        }

        if (thumbs.maxres) {
          build.videothumb['1280w'] = thumbs.maxres.url
        }
      } else {
        build.video = ''
        build.videothumb = {}
        log.update((log_) => {
          return log_.set(new Date(), 'YouTube video not found: ' + build.title)
        })
      }
      /* eslint-enable require-atomic-updates */
    }
  }

  return build
}

export const updateBuilds = async () => {
  progressBar.set(0)

  const buildPromises: Array<{ function: Function; arguments: [Build] }> = []

  const localBuildList = $state.snapshot(buildsData.buildList)

  for (const buildCat of localBuildList) {
    for (const build of buildCat.builds) {
      buildPromises.push({ function: updateBuildVersions, arguments: [build] })
      buildPromises.push({ function: updateBuildVideo, arguments: [build] })
    }
  }

  // Start browser
  await proxy({ mode: 'start' })

  let localCounter = buildPromises.length
  await Promise.allSettled(
    buildPromises.map(async (prom) => {
      return await prom.function(prom.arguments[0]).then(() => {
        localCounter--
        progressBar.set(100 - Math.round((localCounter / buildPromises.length) * 100))
      })
    }),
  )

  // ! possible race condition
  // eslint-disable-next-line require-atomic-updates
  buildsData.buildList = localBuildList

  log.update((log_) => {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    return log_.set(new Date(), 'Sync complete')
  })

  // Close browser
  await proxy({ mode: 'end' })

  progressBar.set(100)
}
