// import axios from 'axios'
import {Build} from '$lib/Build'
import isOutdatedBuild from '$lib/isOutdatedBuild'
import {compareVersions} from 'compare-versions'

export class BuildsData {
  public buildList: BuildList

  public types: BuildTypes

  public versions: Versions

  public currentVersion: string

  public authors: Set<string>

  public constructor(data: BuildsData) {
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

  public sortBuilds() {
    for (const buildcat of this.buildList) {
      buildcat.builds.sort(
        /* eslint-disable @typescript-eslint/indent */
        (buildA, buildB) => {
          // Outdated
          if (isOutdatedBuild(buildA.versions, this.currentVersion, this.versions) && !isOutdatedBuild(buildB.versions, this.currentVersion, this.versions)) {
            return 1
          } else if (!isOutdatedBuild(buildA.versions, this.currentVersion, this.versions) && isOutdatedBuild(buildB.versions, this.currentVersion, this.versions)) {
            return -1
          }

          return 0
        },
      )

      // eslint-disable-next-line complexity
      buildcat.builds.sort((buildA, buildB) => {
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
      buildcat.builds.sort((buildA, buildB) => {
        // Sort pinned
        if (buildA.pin && !buildB.pin) {
          return -1
        } else if (!buildA.pin && buildB.pin) {
          return 1
        }

        return 0
      })
      buildcat.builds.sort((buildA, buildB) => {
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

      buildcat.builds.sort((buildA: Build, buildB: Build) => {
        // Sort by url type
        if (buildA.url.includes('pathofexile.com') && !buildB.url.includes('pathofexile.com')) {
          return -1
        } else if (!buildA.url.includes('pathofexile.com') && buildB.url.includes('pathofexile.com')) {
          return 1
        }

        return 0
      })
      buildcat.builds.sort((buildA: Build, buildB: Build) => {
        // Sort by YouTube url
        if (buildA.url.includes('youtube.com') && !buildB.url.includes('youtube.com')) {
          return 1
        } else if (!buildA.url.includes('youtube.com') && buildB.url.includes('youtube.com')) {
          return -1
        }

        return 0
      })

      buildcat.builds.sort((buildA: Build, buildB: Build) => {
        // Sort by version
        const buildAVersionLatest = buildA.versions[buildA.versions.length - 1]
        const buildBVersionLatest = buildB.versions[buildB.versions.length - 1]
        return compareVersions(buildBVersionLatest, buildAVersionLatest)
      })

      buildcat.builds.sort((buildA: Build, buildB: Build) => {
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

  public save() {
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

    if (duplicateUrls.length === 0) {
      // Cleanup & skipRF
      const buildListFinal = Array.from(this.buildList)
      const rfBuilds = new Set()

      for (const [catIndex, buildCat] of buildListFinal.entries()) {
        for (const [buildIndex, build] of buildCat.builds.entries()) {
          buildListFinal[catIndex].builds[buildIndex] = new Build(build)

          if (buildCat.type === 'rf') {
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

      // await axios.post('http://localhost:3601/save', buildListFull)
      //   .then((response: { data: string }) => {
      //     this.toast.success(response.data, { timeout: 3_000 })
      //   })
      //   .catch((error) => {
      //     this.toast.error(error.message)
      //   })
    } else {
      let log = ''
      for (const element of duplicateUrls) {
        log += '<p>' + element.join('<br />') + '</p>'
      }

      // this.toast.error('<strong>Duplicate URLs detected:</strong><br />' + log, {
      //   timeout: false,
      // })
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
