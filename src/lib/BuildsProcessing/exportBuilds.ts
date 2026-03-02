import { saveData } from '$lib/api/save.remote.ts'
import { checkBuildsForDuplicates } from '$lib/BuildsProcessing/checkBuildsForDuplicates.ts'
import type { BuildsData } from '$lib/schema/BuildsData.schema.ts'
import { log } from '$lib/stores.ts'

// Save builds to external file via server-side API
export const exportBuilds = async (buildsData: BuildsData) => {
  // Validation
  const duplicateUrls = checkBuildsForDuplicates(buildsData.buildList)

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
  const buildListFinal = structuredClone(buildsData.buildList)

  for (const [catIndex, buildCat] of buildListFinal.entries()) {
    for (const [buildIndex, build] of buildCat.builds.entries()) {
      buildListFinal[catIndex].builds[buildIndex] = build
    }
  }

  const buildListFull = {
    currentVersion: buildsData.currentVersion,
    versions: buildsData.versions,
    types: buildsData.types,
    buildList: buildListFinal,
  }

  try {
    await saveData(buildListFull)
    log.update((log_) => {
      return log_.set(new Date(), 'File saved successfully')
    })
  } catch (error) {
    const errorMessage = typeof error === 'object' && 'message' in error ? error.message : String(error)
    log.update((log_) => {
      return log_.set(new Date(), errorMessage)
    })
  }
}
