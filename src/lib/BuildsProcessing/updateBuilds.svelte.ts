import { getGuideVersion } from '#lib/api/getGuideVersion.remote.ts'
import { getYouTubeData, type YouTubeData } from '#lib/api/getYouTubeData.remote.ts'
import { buildsData } from '#lib/BuildsData.svelte.ts'
import { classifyGuideUrl, type GuideVersion } from '#lib/BuildsProcessing/guideSource.ts'
import { isOutdatedBuild } from '#lib/BuildsProcessing/isOutdatedBuild.ts'
import { getYouTubeVideoId } from '#lib/BuildsProcessing/youtubeIntake.ts'
import type { Build } from '#lib/schema/Build.schema.ts'
import { log, progressBar, syncInProgress } from '#lib/stores.ts'
import { isHttpError } from '@sveltejs/kit'
import { SvelteDate } from 'svelte/reactivity'
import { get } from 'svelte/store'

const logFailure = (error: unknown, title: string) => {
  // Remote command errors arrive as HttpError, whose text lives in `body.message`.
  const message = isHttpError(error)
    ? error.body.message
    : typeof error === 'object' && error !== null && 'message' in error
      ? error.message
      : error
  log.update((entries) => entries.set(new Date(), `${String(message)}\n${title}`))
}

const updateBuildVersions = async (build: Build) => {
  // Not outdated → nothing to do
  if (!isOutdatedBuild(build.versions, false)) {
    return build
  }

  const guide = classifyGuideUrl(build.url)
  if (!guide) {
    return build
  }

  if (!guide.supported) {
    log.update((entries) =>
      entries.set(new Date(), `Unsupported ${guide.source.name} guide URL: ${build.title}\n${build.url}`),
    )
    return build
  }

  let guideVersion: GuideVersion
  try {
    guideVersion = await getGuideVersion(build.url)
  } catch (error) {
    logFailure(error, build.title)

    return build
  }

  if (guideVersion.outcome === 'missing') {
    log.update((log_) => {
      return log_.set(
        new Date(),
        `Build or version not found: <a href="${build.url}" target="_blank" rel="noopener">${build.title}</a>.`,
      )
    })
  } else if (guideVersion.outcome === 'ambiguous') {
    log.update((entries) =>
      entries.set(
        new Date(),
        `Ambiguous guide versions (${guideVersion.versions.join(', ')}): ${build.title}\n${build.url}`,
      ),
    )
  } else if (!build.versions.includes(guideVersion.version)) {
    build.versions.push(guideVersion.version)
    log.update((log_) => {
      return log_.set(new Date(), `Updated: ${build.title}\n${build.url}`)
    })
  }

  return build
}

const updateBuildVideo = async (build: Build) => {
  if (build.video) {
    const videoID = getYouTubeVideoId(build.video)
    if (!videoID) {
      log.update((entries) => entries.set(new Date(), `Unsupported YouTube lookup: ${build.title}\n${build.video}`))
      return build
    }

    if (
      !build.videothumb ||
      Object.keys(build.videothumb).length === 0 ||
      (build.videothumb['480w'] && !build.videothumb['480w'].includes(videoID))
    ) {
      let YTdata: YouTubeData

      try {
        YTdata = await getYouTubeData(videoID)
      } catch (error) {
        logFailure(error, build.title)
        return build
      }

      if (YTdata.items.length > 0) {
        const thumbs = YTdata.items[0].snippet.thumbnails
        return {
          ...build,
          videothumb: {
            ...(thumbs.high ? { '480w': thumbs.high.url } : {}),
            ...(thumbs.standard ? { '640w': thumbs.standard.url } : {}),
            ...(thumbs.maxres ? { '1280w': thumbs.maxres.url } : {}),
          },
        }
      } else {
        log.update((log_) => {
          return log_.set(new Date(), 'YouTube video not found: ' + build.title)
        })
        return { ...build, video: undefined, videothumb: {} }
      }
    }
  }

  return build
}

export const updateBuilds = async () => {
  if (get(syncInProgress)) {
    return
  }

  syncInProgress.set(true)

  try {
    progressBar.set(0)
    const sources = $state.snapshot(buildsData.buildList).flatMap((category) => category.builds)

    let completed = 0
    await Promise.all(
      sources.map(async (build) => {
        const versions = [...build.versions]
        const video = build.video
        const videothumb = build.videothumb
        const results = await Promise.allSettled([updateBuildVersions(build), updateBuildVideo(build)])
        for (const result of results) {
          if (result.status === 'rejected') {
            logFailure(result.reason, build.title)
          }
        }

        const videoResult = results[1]

        let live: Build | undefined
        for (const category of buildsData.buildList) {
          live = category.builds.find((candidate) => candidate.url === build.url)
          if (live) {
            break
          }
        }

        if (live) {
          if (
            live.versions.length === versions.length &&
            live.versions.every((version, index) => version === versions[index])
          ) {
            live.versions = build.versions
          }

          if (
            videoResult.status === 'fulfilled' &&
            live.video === video &&
            (['480w', '640w', '1280w'] as const).every((size) => live.videothumb?.[size] === videothumb?.[size])
          ) {
            if (videoResult.value.video === undefined) {
              delete live.video
            } else {
              live.video = videoResult.value.video
            }

            live.videothumb = videoResult.value.videothumb
          }
        }

        completed++
        progressBar.set(Math.round((completed / sources.length) * 100))
      }),
    )

    log.update((entries) => entries.set(new SvelteDate(), 'Sync complete'))
    progressBar.set(100)
  } catch (error) {
    logFailure(error, 'Sync failed')
  } finally {
    syncInProgress.set(false)
  }
}
