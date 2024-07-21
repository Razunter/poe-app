// If singleUrl provided, returns build title or empty string. Otherwise, returns duplicates titles Map.
import type { Build, BuildList } from '$lib/BuildsData.svelte.ts'

/* eslint-disable func-style */
export function checkBuildsForDuplicates(currentBuildList: BuildList): Map<string, string>
export function checkBuildsForDuplicates(currentBuildList: BuildList, singleUrl: string, buildTitle: string): string
export function checkBuildsForDuplicates(
  currentBuildList: BuildList,
  singleUrl?: string,
  buildTitle?: string,
): Map<string, string> | string {
  const duplicateUrls: Map<string, string> = new Map()
  let flatBuildList: Build[] = []
  for (const buildCat of currentBuildList) {
    flatBuildList = flatBuildList.concat(buildCat.builds)
  }

  if (typeof singleUrl === 'string') {
    const foundBuild = flatBuildList.find((build) => {
      return build.url === singleUrl && build.title !== buildTitle
    })

    return foundBuild ? foundBuild.title : ''
  } else {
    const map = new Set<string>()
    for (const build of flatBuildList) {
      if (map.has(build.url)) {
        const originalItem = Array.from(map.keys()).indexOf(build.url)
        duplicateUrls.set(build.title, flatBuildList[originalItem].title)
      } else {
        map.add(build.url)
      }
    }

    return duplicateUrls
  }
}
/* eslint-enable func-style */
