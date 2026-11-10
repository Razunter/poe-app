import { buildsData } from '#lib/BuildsData.svelte.ts'
import { getNewestVersion } from '#lib/BuildsProcessing/getNewestVersion.ts'
import { isOutdatedBuild } from '#lib/BuildsProcessing/isOutdatedBuild.ts'
import { log } from '#lib/stores.ts'
import { compareVersions } from 'compare-versions'

export const removeOutdatedBuilds = () => {
  const count = {
    YT: 0,
    Total: 0,
  }

  const releases = buildsData.versions.toSorted((a, b) => compareVersions(a.version, b.version))
  const currentRelease = releases.findIndex(({ version }) => version === buildsData.currentVersion)

  for (const buildCatIndex of buildsData.buildList.keys()) {
    buildsData.buildList[buildCatIndex].builds = buildsData.buildList[buildCatIndex].builds.filter((build) => {
      let leave = true

      if (isOutdatedBuild(build.versions)) {
        // YT-only
        if (build.url.includes('youtube.com')) {
          leave = false
          count.YT += 1
          count.Total += 1
        } else {
          // Very outdated
          const latestVersion = getNewestVersion(build.versions)
          const latestRelease = latestVersion ? releases.findIndex(({ version }) => version === latestVersion) : -1
          if (currentRelease !== -1 && latestRelease !== -1 && currentRelease - latestRelease > 2) {
            leave = false
            count.Total += 1
          }
        }
      }

      return leave
    })
  }

  log.update((log_) => {
    return log_.set(new Date(), `Removed ${count.YT} YouTube builds and ${count.Total} in total`)
  })
}
