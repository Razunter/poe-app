import {env} from '$env/dynamic/public'
import {Build} from '$lib/Build'
import axios, {AxiosError} from 'axios'
import {compareVersions} from 'compare-versions'
import intersect from 'just-intersect'
import {writable} from 'svelte/store'

export class BuildsDataClass {
  public buildList: BuildList

  public types: BuildTypes

  public versions: Versions[]

  public currentVersion: string

  public authors: Set<string>

  public constructor(data: BuildsDataType) {
    this.buildList = data.buildList
    this.types = data.types
    this.versions = data.versions
    this.currentVersion = data.currentVersion
    this.authors = new Set()

    for (const buildCat of this.buildList) {
      for (let build of buildCat.builds) {
        build = new Build(build)
        if (build.author) {
          this.authors.add(build.author)
        }
      }
    }
  }

  private readonly getBuildTypeBuilds = (buildList: BuildList, buildType: string) => {
    const buildTypeIndex = buildList.findIndex((element) => {
      return element.type === buildType
    })
    return buildList[buildTypeIndex].builds
  }

  public static readonly isOutdatedBuild = (data: BuildsDataType, versions: string[], checkCompatibility = true) => {
    // If build version list has current => not outdated, else check for compatible
    if (versions.includes(data.currentVersion)) {
      return false
    } else if (checkCompatibility) {
      const versionData = data.versions.find((version) => {
        return version.version === data.currentVersion
      })
      if (versionData?.compatible && Array.isArray(versionData.compatible)) {
        return intersect(versionData.compatible, versions).length === 0
      }
    }

    return true
  }

  public sortBuilds() {
    for (const buildCategory of this.buildList) {
      buildCategory.builds.sort(
        /* eslint-disable @typescript-eslint/indent */
        (buildA, buildB) => {
          // Outdated
          if (BuildsDataClass.isOutdatedBuild(this, buildA.versions) && !BuildsDataClass.isOutdatedBuild(this, buildB.versions)) {
            return 1
          } else if (!BuildsDataClass.isOutdatedBuild(this, buildA.versions) && BuildsDataClass.isOutdatedBuild(this, buildB.versions)) {
            return -1
          }

          return 0
        },
      )

      // eslint-disable-next-line complexity
      buildCategory.builds.sort((buildA, buildB) => {
        // Author name
        if (buildA.author && buildB.author) {
          if (buildA.author && buildB.author) {
            // Author bias
            if (buildA.author === 'Zizaran' && buildB.author !== 'Zizaran' && !buildB.url.includes('pathofexile.com')) {
              return -1
            } else if (buildB.author === 'Zizaran' && buildA.author !== 'Zizaran' && !buildA.url.includes('pathofexile.com')) {
              return 1
            }

            if (buildA.author === 'GhazzyTV' && buildB.author !== 'GhazzyTV' && !buildB.url.includes('pathofexile.com')) {
              return 1
            } else if (buildB.author === 'GhazzyTV' && buildA.author !== 'GhazzyTV' && !buildA.url.includes('pathofexile.com')) {
              return -1
            }
          }

          if (buildA.author.toUpperCase() > buildB.author.toUpperCase()) {
            return 1
          } else {
            return -1
          }
        } else if (buildA.author && !buildB.author) {
          return 1
        } else if (!buildA.author && buildB.author) {
          return -1
        }

        return 0
      })
      buildCategory.builds.sort((buildA, buildB) => {
        // Sort pinned
        if (buildA.pin && !buildB.pin) {
          return -1
        } else if (!buildA.pin && buildB.pin) {
          return 1
        }

        return 0
      })
      buildCategory.builds.sort((buildA, buildB) => {
        if (buildA.videothumb && buildB.videothumb) {
          if (buildA.videothumb['640w'] && !buildB.videothumb['640w']) {
            return -1
          } else if (!buildA.videothumb['640w'] && buildB.videothumb['640w']) {
            return 1
          }
        }

        return 0
      })
      /* eslint-enable @typescript-eslint/indent */

      buildCategory.builds.sort((buildA: Build, buildB: Build) => {
        // Sort by url type
        if (buildA.url.includes('pathofexile.com') && !buildB.url.includes('pathofexile.com')) {
          return -1
        } else if (!buildA.url.includes('pathofexile.com') && buildB.url.includes('pathofexile.com')) {
          return 1
        }

        return 0
      })
      buildCategory.builds.sort((buildA: Build, buildB: Build) => {
        // Sort by YouTube url
        if (buildA.url.includes('youtube.com') && !buildB.url.includes('youtube.com')) {
          return 1
        } else if (!buildA.url.includes('youtube.com') && buildB.url.includes('youtube.com')) {
          return -1
        }

        return 0
      })

      buildCategory.builds.sort((buildA: Build, buildB: Build) => {
        // Sort by version
        const buildAVersionLatest = buildA.versions[buildA.versions.length - 1]
        const buildBVersionLatest = buildB.versions[buildB.versions.length - 1]
        return compareVersions(buildBVersionLatest, buildAVersionLatest)
      })

      buildCategory.builds.sort((buildA: Build, buildB: Build) => {
        // Sort by video
        if (buildA.video && !buildB.video) {
          return -1
        } else if (!buildA.video && buildB.video) {
          return 1
        }

        return 0
      })
    }
  }

  public async save() {
    // Validation Start
    const duplicateUrls: Array<[string, string]> = []
    let flatBuildList: Build[] = []
    for (const buildCat of this.buildList) {
      flatBuildList = flatBuildList.concat(buildCat.builds)
    }

    const map = new Set()
    for (const build of flatBuildList) {
      if (map.has(build.url)) {
        const originalItem = Array.from(map.keys())
          .indexOf(build.url)
        duplicateUrls.push([build.title, flatBuildList[originalItem].title])
      } else {
        map.add(build.url)
      }
    }
    // Validation End

    if (duplicateUrls.length > 0) {
      let log = ''
      for (const element of duplicateUrls) {
        log += '<p>' + element.join('<br />') + '</p>'
      }

      console.log(log)
      // this.toast.error('<strong>Duplicate URLs detected:</strong><br />' + log, {
      //   timeout: false,
      // })

      return
    }

    // Cleanup & skipRF
    const buildListFinal = Array.from(this.buildList)
    const rfBuilds = new Set()

    for (const [catIndex, buildCat] of buildListFinal.entries()) {
      for (const [buildIndex, build] of buildCat.builds.entries()) {
        buildListFinal[catIndex].builds[buildIndex] = new Build(build)

        if (buildCat.type === 'rf' && build.versions) {
          for (const version of build.versions) {
            rfBuilds.add(version)
          }
        }
      }
    }

    const buildListFull = {
      currentVersion: this.currentVersion,
      versions: this.versions,
      types: this.types,
      buildList: buildListFinal,
    }

    try {
      const response = await axios.post(`${env.PUBLIC_ORIGIN}:${env.PUBLIC_PORT}/api/save`, buildListFull)
      // show toast
      console.log(response.data)
    } catch (error) {
      // show error toast
      console.error(error instanceof AxiosError ? error.message : error)
    }
  }
}

export type BuildTypes = {
  [key: string]: string;
}

export type BuildCategory = {
  type: string;
  builds: Build[];
}

export type BuildList = BuildCategory[]

export type Versions = {
  version: string;
  name: string;
  wip?: boolean;
  url?: string;
  note?: string;
  compatible?: string[];
}

export type BuildsDataType = {
  buildList: BuildList;
  types: BuildTypes;
  versions: Versions[];
  currentVersion: string;
  authors: Set<string>;
}

export const BuildsData = writable<BuildsDataClass>()
