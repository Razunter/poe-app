// If singleUrl provided, returns build title or empty string. Otherwise, returns duplicates titles Map.

import type { Build } from '#lib/schema/Build.schema.ts'
import type { BuildList } from '#lib/schema/BuildsData.schema.ts'

export function checkBuildsForDuplicates(currentBuildList: BuildList): Map<string, string>
export function checkBuildsForDuplicates(currentBuildList: BuildList, singleUrl: string, originalUrl?: string): string
export function checkBuildsForDuplicates(
  currentBuildList: BuildList,
  singleUrl?: string,
  originalUrl?: string,
): Map<string, string> | string {
  const duplicateUrls: Map<string, string> = new Map()
  let flatBuildList: Build[] = []
  for (const buildCat of currentBuildList) {
    flatBuildList = [...flatBuildList, ...buildCat.builds]
  }

  if (typeof singleUrl === 'string') {
    const originalIndex = originalUrl ? flatBuildList.findIndex((build) => build.url === originalUrl) : -1
    const foundBuild = flatBuildList.find((build, index) => {
      return index !== originalIndex && build.url === singleUrl
    })

    return foundBuild ? foundBuild.title || foundBuild.url : ''
  } else {
    const map = new Set<string>()
    for (const build of flatBuildList) {
      if (map.has(build.url)) {
        const originalItem = [...map.keys()].indexOf(build.url)
        duplicateUrls.set(build.title, flatBuildList[originalItem].title)
      } else {
        map.add(build.url)
      }
    }

    return duplicateUrls
  }
}
