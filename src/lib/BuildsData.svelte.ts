import { derived, writable } from 'svelte/store'

export const buildList = writable<BuildList>([])
export const buildTypes = writable<BuildTypes>({})
export const allPoeVersions = writable<Versions[]>([])
export const currentPoeVersion = writable<string>('')

export const allBuildAuthors = derived(buildList, (currentBuildList) => {
  const authors = new Set<string>()
  for (const buildCat of currentBuildList) {
    for (const build of buildCat.builds) {
      if (build.author) {
        authors.add(build.author)
      }
    }
  }

  return authors
})

export type Build = {
  title: string
  url: string
  video?: string
  videothumb?: {
    '480w'?: string
    '640w'?: string
    '1280w'?: string
  }
  versions: string[]
  author?: string
  pin?: boolean
  skip?: boolean
  tags?: string[]
}

export type BuildTypes = {
  [key: string]: string
}

export type BuildCategory = {
  type: string
  builds: Build[]
}

export type BuildList = BuildCategory[]

export type Versions = {
  version: string
  name: string
  wip?: boolean
  url?: string
  note?: string
  compatible?: string[]
}

export type BuildsDataType = {
  buildList: BuildList
  types: BuildTypes
  versions: Versions[]
  currentVersion: string
  authors: Set<string>
}
