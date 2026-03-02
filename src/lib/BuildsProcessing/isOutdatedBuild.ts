import { buildsData } from '$lib/BuildsData.svelte.ts'
import intersect from 'just-intersect'

export const isOutdatedBuild = (versions: string[], checkCompatibility = true) => {
  const localCurrentPoeVersion = buildsData.currentVersion

  // If build version list has current => not outdated, else check for compatible
  if (versions.includes(localCurrentPoeVersion)) {
    return false
  } else if (checkCompatibility) {
    const currentPoeVersions = buildsData.versions
    const versionData = currentPoeVersions.find((version) => {
      return version.version === localCurrentPoeVersion
    })
    if (versionData?.compatible) {
      return intersect(versionData.compatible, versions).length === 0
    }
  }

  return true
}
