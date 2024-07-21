import { PUBLIC_ORIGIN } from '$env/static/public'
import { type Build, buildList } from '$lib/BuildsData.svelte.ts'
import { isOutdatedBuild } from '$lib/BuildsProcessing/isOutdatedBuild.ts'
import { log, progressBar } from '$lib/stores.ts'
import axios from 'axios'
import { get } from 'svelte/store'

// Update build versions from PoE Forum & PoE-vault
const updateBuildVersions = async (build: Build) => {
  // Not outdated → nothing to do
  if (!isOutdatedBuild(build.versions, false)) {
    return
  }

  // URL isn't supported → nothing to do
  if (
    !build.url.includes('pathofexile.com') &&
    // PoE Vault blocks requests
    // !build.url.includes('poe-vault.com') &&
    !build.url.includes('maxroll.gg')
  ) {
    return
  }

  await axios
    .get<string>(`${PUBLIC_ORIGIN}/api/proxy`, {
      params: { targetUrl: build.url },
    })
    .then((response) => {
      if (typeof response.data === 'string' && response.data.startsWith('Error')) {
        log.update((log_) => {
          return log_.set(new Date(), response.data + '\n' + build.title)
        })
      } else if (response.data === '') {
        log.update((log_) => {
          return log_.set(
            new Date(),
            `Build or version not found: <a href="${build.url}" target="_blank" rel="noopener">${build.title}</a>.`,
          )
        })
      } else if (!build.versions.includes(response.data)) {
        build.versions.push(response.data)
        log.update((log_) => {
          return log_.set(new Date(), `Updated: ${build.title}\n${build.url}`)
        })
      }
    })
    .catch((error) => {
      // handle error
      log.update((log_) => {
        return log_.set(
          new Date(),
          'message' in error ? error.message + '\n' + build.title : String(error) + '\n' + build.title,
        )
      })
    })
}

const updateBuildVideo = async (build: Build) => {
  if (build.video && build.video.indexOf('youtube.com') > 0) {
    const videoID = build.video.slice(Math.max(0, build.video.lastIndexOf('?v=') + 3))

    if (build.videothumb?.['480w'] && !build.videothumb['480w'].includes(videoID)) {
      build.videothumb = {}
    }

    if (!build.videothumb || Object.keys(build.videothumb).length === 0) {
      await axios
        .get(`${PUBLIC_ORIGIN}/api/youtube`, {
          params: { videoID },
        })
        .then(({ data }) => {
          if (data.items.length > 0) {
            const thumbs = data.items[0].snippet.thumbnails
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
        })
        .catch((error) => {
          // handle error
          log.update((log_) => {
            return log_.set(new Date(), ('message' in error ? error.message : String(error)) + '\n' + build.title)
          })
        })
    }
  } else if (build.video?.includes('twitch.tv') && !build.videothumb) {
    const videoID = build.video.slice(Math.max(0, build.video.lastIndexOf('/') + 1))
    const { data: video } = await axios.get(`${PUBLIC_ORIGIN}/api/twitch`, {
      params: { videoID },
    })
    if (!video) {
      log.update((log_) => {
        return log_.set(new Date(), 'Twitch video not found: ' + build.video)
      })
      return false
    }

    // eslint-disable-next-line require-atomic-updates
    build.videothumb = {
      '480w': video.thumbnailUrl.replace('%{width}', '480').replace('%{height}', '360'),
      '640w': video.thumbnailUrl.replace('%{width}', '640').replace('%{height}', '480'),
      '1280w': video.thumbnailUrl.replace('%{width}', '1280').replace('%{height}', '720'),
    }
  }

  return true
}

export const updateBuilds = async (currentBuildList = get(buildList)) => {
  progressBar.set(0)

  const buildPromises: Array<{ function: Function; arguments: [Build] }> = []
  for (const buildCat of currentBuildList) {
    for (const build of buildCat.builds) {
      buildPromises.push({ function: updateBuildVersions, arguments: [build] })
      buildPromises.push({ function: updateBuildVideo, arguments: [build] })
    }
  }

  // Start browser
  await axios.get(`${PUBLIC_ORIGIN}/api/proxy`, {
    params: { mode: 'start' },
  })

  let localCounter = buildPromises.length
  await Promise.allSettled(
    buildPromises.map(async (prom) => {
      return await prom.function(prom.arguments[0]).then(() => {
        localCounter--
        progressBar.set(100 - Math.round((localCounter / buildPromises.length) * 100))
      })
    }),
  )

  log.update((log_) => {
    return log_.set(new Date(), 'Sync complete')
  })

  // Close browser
  await axios.get(`${PUBLIC_ORIGIN}/api/proxy`, {
    params: { mode: 'end' },
  })

  progressBar.set(100)

  return currentBuildList
}
