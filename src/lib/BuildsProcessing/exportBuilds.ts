import { PUBLIC_ORIGIN } from '$env/static/public'
import { allPoeVersions, buildList, buildTypes, currentPoeVersion } from '$lib/BuildsData.svelte.ts'
import { checkBuildsForDuplicates } from '$lib/BuildsProcessing/checkBuildsForDuplicates.ts'
import { log } from '$lib/stores.ts'
import axios, { AxiosError } from 'axios'
import { get } from 'svelte/store'

// Save builds to external file via server-side API
export const exportBuilds = async (currentBuildList = get(buildList)) => {
  // Validation
  const duplicateUrls = checkBuildsForDuplicates(currentBuildList)

  if (duplicateUrls.size > 0) {
    let logMessage = ''
    for (const element of duplicateUrls) {
      logMessage += '<p>' + element.join('<br />') + '</p>'
    }

    log.update((log_) => {
      return log_.set(new Date(), '<strong>Duplicate URLs detected:</strong><br />' + logMessage)
    })

    return
  }

  // Cleanup
  const buildListFinal = structuredClone(currentBuildList)

  for (const [catIndex, buildCat] of buildListFinal.entries()) {
    for (const [buildIndex, build] of buildCat.builds.entries()) {
      buildListFinal[catIndex].builds[buildIndex] = build
    }
  }

  const buildListFull = {
    currentVersion: get(currentPoeVersion),
    versions: get(allPoeVersions),
    types: get(buildTypes),
    buildList: buildListFinal,
  }

  try {
    const response = await axios.post(`${PUBLIC_ORIGIN}/api/save`, buildListFull)
    log.update((log_) => {
      return log_.set(new Date(), response.data)
    })
  } catch (error) {
    const errorMessage = error instanceof AxiosError ? error.message : String(error)
    log.update((log_) => {
      return log_.set(new Date(), errorMessage)
    })
  }
}
