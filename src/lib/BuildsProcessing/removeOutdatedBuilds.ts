import { buildList, currentPoeVersion } from '$lib/BuildsData.svelte.ts'
import { convertVersionToInt } from '$lib/BuildsProcessing/convertVersionToInt.ts'
import { isOutdatedBuild } from '$lib/BuildsProcessing/isOutdatedBuild.ts'
import { log } from '$lib/stores.ts'
import { get } from 'svelte/store'

export const removeOutdatedBuilds = (currentBuildList = get(buildList)) => {
  const count = {
    YT: 0,
    Total: 0,
  }

  const currentVersionInt = convertVersionToInt(get(currentPoeVersion))

  for (const buildCat of currentBuildList) {
    buildCat.builds = buildCat.builds.filter((build) => {
      let leave = true

      if (isOutdatedBuild(build.versions)) {
        // YT-only
        if (build.url.includes('youtube.com')) {
          leave = false
          count.YT += 1
          count.Total += 1
        } else {
          // Very outdated
          const lastV = convertVersionToInt(build.versions[build.versions.length - 1])
          if (lastV < currentVersionInt - 2) {
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

  return currentBuildList
}
