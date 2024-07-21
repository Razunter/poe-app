import { buildList } from '$lib/BuildsData.svelte.ts'
import shuffle from 'just-shuffle'
import { get } from 'svelte/store'

export const randomizeBuildsOrder = (currentBuildList = get(buildList)) => {
  for (const buildCategory of currentBuildList) {
    buildCategory.builds = shuffle(buildCategory.builds)
  }

  return currentBuildList
}
