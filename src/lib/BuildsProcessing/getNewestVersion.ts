import { compareVersions } from 'compare-versions'

export const getNewestVersion = (versions: string[]) => {
  let newest: string | undefined
  for (const version of versions) {
    if (newest === undefined || compareVersions(version, newest) > 0) {
      newest = version
    }
  }

  return newest
}
