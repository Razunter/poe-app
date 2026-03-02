import { buildsData } from '$lib/BuildsData.svelte.ts'
import { convertVersionToInt } from '$lib/BuildsProcessing/convertVersionToInt.ts'
import { isOutdatedBuild } from '$lib/BuildsProcessing/isOutdatedBuild.ts'
import { log } from '$lib/stores.ts'

export const removeOutdatedBuilds = () => {
  const count = {
    YT: 0,
    Total: 0,
  }

  const currentVersionInt = convertVersionToInt(buildsData.currentVersion)

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
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const lastV = convertVersionToInt(build.versions.at(-1)!)
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
}
