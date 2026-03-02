import { buildsData } from '$lib/BuildsData.svelte.ts'
import shuffle from 'just-shuffle'

export const randomizeBuildsOrder = () => {
  const localBuildsList = $state.snapshot(buildsData.buildList)
  for (const buildCategory of localBuildsList) {
    buildCategory.builds = shuffle(buildCategory.builds)
  }

  buildsData.buildList = localBuildsList
}
