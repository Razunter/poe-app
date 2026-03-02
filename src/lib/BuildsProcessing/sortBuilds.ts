import { buildsData } from '$lib/BuildsData.svelte.ts'
import { isOutdatedBuild } from '$lib/BuildsProcessing/isOutdatedBuild.ts'
import type { Build } from '$lib/schema/Build.schema.ts'
import { compareVersions } from 'compare-versions'

export const sortBuilds = () => {
  for (const buildCategory of buildsData.buildList) {
    buildCategory.builds.sort((buildA, buildB) => {
      const build1outdated = isOutdatedBuild(buildA.versions)
      const build2outdated = isOutdatedBuild(buildB.versions)
      // Outdated
      if (build1outdated && !build2outdated) {
        return 1
      } else if (!build1outdated && build2outdated) {
        return -1
      }

      return 0
    })

    buildCategory.builds.sort((buildA, buildB) => {
      // Author name
      if (buildA.author && buildB.author) {
        if (buildA.author && buildB.author) {
          // Author bias
          if (buildA.author === 'Zizaran' && buildB.author !== 'Zizaran' && !buildB.url.includes('pathofexile.com')) {
            return -1
          } else if (
            buildB.author === 'Zizaran' &&
            buildA.author !== 'Zizaran' &&
            !buildA.url.includes('pathofexile.com')
          ) {
            return 1
          }

          // Videos make eyes bleed
          if (
            buildA.author === 'Tripolar Bear' &&
            buildB.author !== 'Tripolar Bear' &&
            !buildB.url.includes('pathofexile.com')
          ) {
            return 1
          } else if (
            buildB.author === 'Tripolar Bear' &&
            buildA.author !== 'Tripolar Bear' &&
            !buildA.url.includes('pathofexile.com')
          ) {
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
      const buildAVersionLatest = buildA.versions.at(-1)
      const buildBVersionLatest = buildB.versions.at(-1)

      if (buildAVersionLatest && buildBVersionLatest) {
        return compareVersions(buildBVersionLatest, buildAVersionLatest)
      } else {
        return 0
      }
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
