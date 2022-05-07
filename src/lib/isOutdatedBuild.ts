import { intersection, isArray } from 'lodash-es'
import { type Versions } from '@/lib/dataTypes'

const isOutdatedBuild = (versions: string[] | undefined, currentVersion: string, allVersions: Versions[], checkCompatibility = true) => {
  // If build version list has current => not outdated, else check for compatible
  if (versions?.includes(currentVersion)) {
    return false
  } else if (checkCompatibility) {
    const versionData = allVersions.find((version) => {
      return version.version === currentVersion
    })
    if (versionData?.compatible && isArray(versionData.compatible)) {
      return intersection(versionData.compatible, versions).length === 0
    }
  }

  return true
}

export default isOutdatedBuild
