import {PUBLIC_ORIGIN} from '$env/static/public'
import {Build} from '$lib/Build'
import type {WritableLog} from '$lib/stores'
import axios, {AxiosError} from 'axios'
import {compareVersions} from 'compare-versions'
import intersect from 'just-intersect'
import shuffle from 'just-shuffle'
import type {Writable} from 'svelte/store'

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
          const buildAoutdated = BuildsDataClass.isOutdatedBuild(this, buildA.versions)
          const buildBoutdated = BuildsDataClass.isOutdatedBuild(this, buildB.versions)
          // Outdated
          if (buildAoutdated && !buildBoutdated) {
            return 1
          } else if (!buildAoutdated && buildBoutdated) {
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

            // Videos make eyes bleed
            if (buildA.author === 'Tripolar Bear' && buildB.author !== 'Tripolar Bear' && !buildB.url.includes('pathofexile.com')) {
              return 1
            } else if (buildB.author === 'Tripolar Bear' && buildA.author !== 'Tripolar Bear' && !buildA.url.includes('pathofexile.com')) {
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

    return this
  }

  public static convertVersionToInt = (versionString: string) => {
    const vArray = versionString.split('.')
    for (const [index, vArrayItem] of vArray.entries()) {
      if (vArrayItem.length < 2) {
        vArray[index] = '0' + vArrayItem
      }
    }

    return Number.parseInt(vArray.join(''), 10)
  }

  public cleanup = (log: WritableLog) => {
    const count = {
      YT: 0,
      Total: 0,
    }

    for (const buildCat of this.buildList) {
      for (const [index, build] of buildCat.builds.entries()) {
        if (BuildsDataClass.isOutdatedBuild(this, build.versions)) {
          // YT-only
          if (build.url.includes('youtube.com')) {
            buildCat.builds.splice(index, 1)
            count.YT += 1
            count.Total += 1
          }

          // Very outdated
          const lastV = BuildsDataClass.convertVersionToInt(build.versions[build.versions.length - 1])
          const currentVersionInt = BuildsDataClass.convertVersionToInt(this.currentVersion)
          if (lastV < currentVersionInt - 2) {
            buildCat.builds.splice(index, 1)
            count.Total += 1
          }
        }
      }
    }

    log.update((log_) => {
      return log_.set(new Date, `Removed ${count.YT} YouTube builds and ${count.Total} in total`)
    })

    return this
  }

  public randomizeOrder = () => {
    for (const buildcat of this.buildList) {
      buildcat.builds = shuffle(buildcat.builds)
    }

    return this
  }

  // If singleUrl provided, returns build title or empty string. Otherwise, returns duplicates titles Map.
  public static checkForDuplicates(buildList: BuildList): Map<string, string>
  public static checkForDuplicates(buildList: BuildList, singleUrl: string, buildTitle: string): string
  public static checkForDuplicates(buildList: BuildList, singleUrl?: string, buildTitle?: string): Map<string, string> | string {
    const duplicateUrls: Map<string, string> = new Map()
    let flatBuildList: Build[] = []
    for (const buildCat of buildList) {
      flatBuildList = flatBuildList.concat(buildCat.builds)
    }

    if (typeof singleUrl === 'string') {
      const foundBuild = flatBuildList.find((build) => {
        return (build.url === singleUrl) && (build.title !== buildTitle)
      })

      return (foundBuild ? foundBuild.title : '')
    } else {
      const map = new Set<string>()
      for (const build of flatBuildList) {
        if (map.has(build.url)) {
          const originalItem = Array.from(map.keys())
            .indexOf(build.url)
          duplicateUrls.set(build.title, flatBuildList[originalItem].title)
        } else {
          map.add(build.url)
        }
      }

      return duplicateUrls
    }
  }

  // Update build versions from PoE Forum & PoE-vault
  private syncBuilds_UpdateVersions = async (log: WritableLog, build: Build) => {
    // Not outdated → nothing to do
    if (!BuildsDataClass.isOutdatedBuild(this, build.versions, false)) {
      return
    }

    // URL isn't supported → nothing to do
    if (!build.url.includes('pathofexile.com') &&
      !build.url.includes('poe-vault.com') &&
      !build.url.includes('maxroll.gg')
    ) {
      return
    }

    await axios.get<string>(`${PUBLIC_ORIGIN}/api/proxy`, {
      params: {targetUrl: build.url},
    })
      .then((response) => {
        if (typeof response.data === 'string' && response.data.startsWith('Error')) {
          log.update((log_) => {
            return log_.set(new Date(), response.data + '\n' + build.title)
          })
        } else if (response.data === '') {
          log.update((log_) => {
            return log_.set(new Date(), 'Build or version not found: ' + build.title)
          })
        } else if (!build.versions.includes(response.data)) {
          build.versions.push(response.data)
          log.update((log_) => {
            return log_.set(new Date(), `Updated: ${build.title}\n${build.url}`)
          })
        }
      })
      .catch((error) => {
        // handle error
        log.update((log_) => {
          return log_.set(new Date(), 'message' in error ? error.message : String(error) + '\n' + build.title)
        })
      })
  }

  private syncBuilds_Video = async (log: WritableLog, build: Build) => {
    if (build.video && build.video.indexOf('youtube.com') > 0) {
      const videoID = build.video.slice(Math.max(0, build.video.lastIndexOf('?v=') + 3))

      if (build.videothumb?.['480w'] && !build.videothumb['480w'].includes(videoID)) {
        build.videothumb = {}
      }

      if (!build.videothumb || Object.keys(build.videothumb).length === 0) {
        await axios.get(`${PUBLIC_ORIGIN}/api/youtube`, {
          params: {videoID},
        })
          .then(({data}) => {
            if (data.items.length > 0) {
              const thumbs = data.items[0].snippet.thumbnails
              build.videothumb = {
                '480w': thumbs.high.url,
              }
              if (thumbs.standard) {
                build.videothumb['640w'] = thumbs.standard.url
              }

              if (thumbs.maxres) {
                build.videothumb['1280w'] = thumbs.maxres.url
              }
            } else {
              build.video = ''
              build.videothumb = {}
              log.update((log_) => {
                return log_.set(new Date(), 'YouTube video not found: ' + build.title)
              })
            }
          })
          .catch((error) => {
            // handle error
            log.update((log_) => {
              return log_.set(new Date(), ('message' in error ? error.message : String(error)) + '\n' + build.title)
            })
          })
      }
    } else if (build.video?.includes('twitch.tv') && !build.videothumb) {
      const videoID = build.video.slice(Math.max(0, build.video.lastIndexOf('/') + 1))
      const {data: video} = await axios.get(`${PUBLIC_ORIGIN}/api/twitch`, {
        params: {videoID},
      })
      if (!video) {
        log.update((log_) => {
          return log_.set(new Date(), 'Twitch video not found: ' + build.video)
        })
        return false
      }

      // eslint-disable-next-line require-atomic-updates
      build.videothumb = {
        '480w': video.thumbnailUrl.replace('%{width}', '480')
          .replace('%{height}', '360'),
        '640w': video.thumbnailUrl.replace('%{width}', '640')
          .replace('%{height}', '480'),
        '1280w': video.thumbnailUrl.replace('%{width}', '1280')
          .replace('%{height}', '720'),
      }
    }

    return true
  }

  public syncBuilds = async (progressBar: Writable<number>, log: WritableLog) => {
    progressBar.set(0)

    const buildPromises: Array<{ function: Function, arguments: [WritableLog, Build] }> = []
    for (const buildCat of this.buildList) {
      for (const build of buildCat.builds) {
        buildPromises.push({function: this.syncBuilds_UpdateVersions, arguments: [log, build]})
        buildPromises.push({function: this.syncBuilds_Video, arguments: [log, build]})
      }
    }

    // Start browser
    await axios.get(`${PUBLIC_ORIGIN}/api/proxy`, {
      params: {mode: 'start'},
    })

    let localCounter = buildPromises.length
    await Promise.allSettled(buildPromises.map(async (prom) => {
      return await prom.function(prom.arguments[0], prom.arguments[1]).then(() => {
        localCounter--
        progressBar.set(100 - Math.round((localCounter / buildPromises.length) * 100))
      })
    }))

    log.update((log_) => {
      return log_.set(new Date(), 'Sync complete')
    })

    // Close browser
    await axios.get(`${PUBLIC_ORIGIN}/api/proxy`, {
      params: {mode: 'end'},
    })

    progressBar.set(100)

    return this
  }

  public async save(log: WritableLog) {
    // Validation
    const duplicateUrls = BuildsDataClass.checkForDuplicates(this.buildList)

    if (duplicateUrls.size > 0) {
      let logMessage = ''
      for (const element of duplicateUrls) {
        logMessage += '<p>' + element.join('<br />') + '</p>'
      }

      log.update((log_) => {
        return log_.set(new Date(), '<strong>Duplicate URLs detected:</strong><br />' + logMessage)
      })

      return
    }

    // Cleanup
    const buildListFinal = Array.from(this.buildList)

    for (const [catIndex, buildCat] of buildListFinal.entries()) {
      for (const [buildIndex, build] of buildCat.builds.entries()) {
        buildListFinal[catIndex].builds[buildIndex] = new Build(build)
      }
    }

    const buildListFull = {
      currentVersion: this.currentVersion,
      versions: this.versions,
      types: this.types,
      buildList: buildListFinal,
    }

    try {
      const response = await axios.post(`${PUBLIC_ORIGIN}/api/save`, buildListFull)
      log.update((log_) => {
        return log_.set(new Date(), response.data)
      })
    } catch (error) {
      const errorMessage = error instanceof AxiosError ? error.message : String(error)
      log.update((log_) => {
        return log_.set(new Date(), errorMessage)
      })
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

export type BuildsDataWritable = Writable<BuildsDataClass>
