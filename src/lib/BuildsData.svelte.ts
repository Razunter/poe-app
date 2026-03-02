import type { BuildsData } from '$lib/schema/BuildsData.schema.ts'
import { SvelteSet } from 'svelte/reactivity'

export const buildsData = $state<BuildsData>({
  buildList: [],
  types: {},
  currentVersion: '',
  versions: [],
})

const allBuildAuthors = $derived.by(() => {
  const authors = new SvelteSet<string>()

  for (const buildCat of buildsData.buildList) {
    for (const build of buildCat.builds) {
      if (build.author) {
        authors.add(build.author)
      }
    }
  }

  return authors
})

export const getAllBuildAuthors = () => allBuildAuthors
