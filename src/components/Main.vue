<template>
  <v-app>
    <v-navigation-drawer app>
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title class="text-h6">
            Actions
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-divider />

      <v-list
        :nav="true"
      >
        <ButtonSettings
          :versions.sync="versions"
          :current-version.sync="currentVersion"
        />

        <v-divider />

        <ButtonSync
          :build-list.sync="buildList"
          :current-version="currentVersion"
          @update:buildList="sortBuilds"
        />

        <v-list-item @click="sortBuilds">
          <v-list-item-icon>
            <v-icon>mdi-sort-ascending</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Sort</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <ButtonRandomize
          :build-list.sync="buildList"
          :current-version="currentVersion"
          @update:buildList="sortBuilds"
        />

        <ButtonCleanup
          :build-list.sync="buildList"
          :current-version="currentVersion"
          @update:buildList="saveBuilds"
        />

        <v-list-item @click="saveBuilds">
          <v-list-item-icon>
            <v-icon>mdi-content-save</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Save</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>

      <v-divider />

      <v-card
        outlined
        width="100%"
      >
        <v-card-title>Filters:</v-card-title>
        <v-card-text>
          <v-switch
            v-model="filters.showOutdated"
            label="Show outdated"
          />
        </v-card-text>
      </v-card>
    </v-navigation-drawer>
    <v-app-bar app>
      <v-app-bar-title>Razunter's PoE Builds admin panel</v-app-bar-title>

      <template #extension>
        <v-btn-toggle>
          <v-btn
            v-for="(buildType, buildKey) in types"
            :key="buildKey"
            @click="$vuetify.goTo('#'+buildKey)"
          >
            {{ buildType }}
          </v-btn>
        </v-btn-toggle>
      </template>
    </v-app-bar>
    <v-main>
      <v-card
        v-for="buildtype in buildList"
        :key="buildtype.type"
        class="buildlist"
      >
        <v-card-title
          :id="buildtype.type"
          class="buildlist__group__title"
        >
          {{ typeName(buildtype.type) }}
        </v-card-title>
        <v-card-actions>
          <v-btn
            color="green"
            @click="addBuild(buildtype.type)"
          >
            Add build
          </v-btn>
        </v-card-actions>
        <v-card-text>
          <div
            v-for="(build, index) of buildtype.builds"
            v-show="(filters.showOutdated && outdated(build.versions)) || !outdated(build.versions)"
            :key="build.title"
            class="buildlist__item"
          >
            <Build
              :ref="`build-${buildtype.type}-${index}`"
              :build="build"
              :build-type="typeName(buildtype.type)"
              :outdated="outdated(build.versions)"
              @update:build="updateBuild($event, buildtype.type, index)"
              @update:delete="deleteBuild(buildtype.type, index)"
            />
          </div>
        </v-card-text>
      </v-card>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import axios from 'axios'
import { defineComponent } from 'vue'
import { useToast } from 'vue-toastification'
import Build from '@/components/Build.vue'
import type { BuildList, BuildTypes, Versions } from '@/lib/dataTypes'
import { useStore } from '@/store/authors'

// const getBuildTypeBuilds = (buildList: BuildList, buildType: string) => {
//   const buildTypeIndex = buildList.findIndex((element) => {
//     return element.type === buildType
//   })
//   return buildList[buildTypeIndex].builds
// }

export default defineComponent({
  name: 'MainComponent',
  components: {
    Build,
    // ButtonCleanup,
    // ButtonRandomize,
    // ButtonSettings,
    // ButtonSync,
  },

  async setup () {
    // Get toast interface
    const toast = useToast()

    const { data } = await axios.get('http://localhost:3601/load')
    const buildList = data.buildList
    for (const buildCat of buildList) {
      for (const build of buildCat.builds) {
        if (!build.author) {
          build.author = ''
        }
      }
    }

    const store = useStore()
    for (const buildCat of buildList) {
      for (const build of buildCat.builds) {
        if (build.author) {
          store.$patch((state) => {
            state.authors.add(build.author)
          })
        }
      }
    }

    return {
      toast,
      types: data.types,
      buildList,
      versions: data.versions,
      currentVersion: data.currentVersion,
      filters: {
        showOutdated: false,
      },
    } as AppData
  },
  methods: {
    typeName (typeID: string) {
      return this.types[typeID]
    },
    outdated (versions: string[]) {
      if (versions) {
        return !versions.includes(this.currentVersion)
      } else {
        return true
      }
    },
    /**
     * @param {object} event
     * @param {string} type
     * @param {number} index
     */
    updateBuild (event: BuildClass, type: string, index: number) {
      getBuildTypeBuilds(this.buildList, type)[index] = event
      if (event.author) {
        const store = useStore()
        store.$patch((state) => {
          state.authors.add(event.author)
        })
      }
    },
    deleteBuild (buildType: string, index: number) {
      getBuildTypeBuilds(this.buildList, buildType)
        .splice(index, 1)
    },
    addBuild (buildType: string) {
      getBuildTypeBuilds(this.buildList, buildType)
        .unshift(new BuildClass({
          versions: [this.currentVersion],
        }))
      void this.$nextTick(function () {
        (this.$refs[`build-${buildType}-0`] as typeof Build)[0].showDialog = true
      })
    },
    sortBuilds () {
      for (const buildcat of this.buildList) {
        buildcat.builds.sort(
          // Outdated
          firstBy<BuildClass>((buildA, buildB) => {
            if (this.outdated(buildA.versions) && !this.outdated(buildB.versions)) {
              return 1
            } else if (!this.outdated(buildA.versions) && this.outdated(buildB.versions)) {
              return -1
            }

            return 0
          })
            .thenBy<BuildClass>((buildA, buildB) => {
              // Sort by version
              const buildAVersionLatest = buildA.versions[buildA.versions.length - 1]
              const buildBVersionLatest = buildB.versions[buildB.versions.length - 1]
              return compareVersions(buildAVersionLatest, buildBVersionLatest)
            })
            .thenBy<BuildClass>((buildA, buildB) => {
              // Sort pinned
              if (buildA.pin && !buildB.pin) {
                return -1
              } else if (!buildA.pin && buildB.pin) {
                return 1
              }

              return 0
            })
            .thenBy<BuildClass>((buildA, buildB) => {
              // Author name
              if (buildA.author && buildB.author) {
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
            .thenBy<BuildClass>((buildA, buildB) => {
              if (buildA.videothumb && buildB.videothumb) {
                if (buildA.videothumb['640w'] && !buildB.videothumb['640w']) {
                  return -1
                } else if (!buildA.videothumb['640w'] && buildB.videothumb['640w']) {
                  return 1
                }
              }

              return 0
            }),
        )
        buildcat.builds.sort((buildA: BuildClass, buildB: BuildClass) => {
          // Sort by url type
          if (buildA.url.includes('pathofexile.com') && !buildB.url.includes('pathofexile.com')) {
            return -1
          } else if (!buildA.url.includes('pathofexile.com') && buildB.url.includes('pathofexile.com')) {
            return 1
          }

          return 0
        })
        buildcat.builds.sort((buildA: BuildClass, buildB: BuildClass) => {
          // Sort by YouTube url
          if (buildA.url.includes('youtube.com') && !buildB.url.includes('youtube.com')) {
            return 1
          } else if (!buildA.url.includes('youtube.com') && buildB.url.includes('youtube.com')) {
            return -1
          }

          return 0
        })
        buildcat.builds.sort((buildA: BuildClass, buildB: BuildClass) => {
          if (buildA.author && buildB.author) {
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

          return 0
        })
        buildcat.builds.sort((buildA: BuildClass, buildB: BuildClass) => {
          // Sort by video
          if (buildA.video && !buildB.video) {
            return -1
          } else if (!buildA.video && buildB.video) {
            return 1
          }

          return 0
        })
      }
    },
    async saveBuilds () {
      // Validation Start
      const duplicateUrls: Array<[string, string]> = []
      let flatBuildList: BuildClass[] = []
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
            buildListFinal[catIndex].builds[buildIndex] = new BuildClass(build)

            if (buildCat.type === 'rf') {
              for (const version of build.versions) {
                rfBuilds.add(version)
              }
            }
          }
        }

        if (!rfBuilds.has(this.currentVersion)) {
          this.versions[this.versions.length - 1].skiprf = true
        }

        const buildListFull = {
          currentVersion: this.currentVersion,
          versions: this.versions,
          types: this.types,
          buildList: buildListFinal,
        }

        await axios.post('http://localhost:3601/save', buildListFull)
          .then((response: { data: string }) => {
            this.toast.success(response.data, { timeout: 3_000 })
          })
      } else {
        let log = ''
        for (const element of duplicateUrls) {
          log += '<p>' + element.join('<br />') + '</p>'
        }

        this.toast.error('<strong>Duplicate URLs detected:</strong><br />' + log, {
          timeout: false,
        })
      }
    },
  },
})

type AppData = {
  toast: ReturnType<typeof useToast>;
  types: BuildTypes;
  buildList: BuildList;
  currentVersion: string;
  versions: Versions[];
  filters: {
    showOutdated: boolean;
  };
}
</script>
