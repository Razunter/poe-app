<template>
  <q-layout view="lHh LpR fFf">
    <q-header
      elevated
      class="bg-dark text-white"
      height-hint="98"
    >
      <q-toolbar>
        <q-btn
          dense
          flat
          round
          icon="mdi-menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          Razunter's PoE Builds admin panel
        </q-toolbar-title>

        <q-btn
          dense
          flat
          round
          icon="mdi-menu"
          @click="toggleRightDrawer"
        />
      </q-toolbar>

      <q-tabs align="left">
        <q-route-tab
          v-for="(buildType, buildKey) in types"
          :key="buildKey"
          :label="buildType"
          :href="'#'+buildKey"
        />
      </q-tabs>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      side="left"
      behavior="desktop"
      bordered
    >
      <q-list bordered>
        <q-item-label
          header
          class="text-h6"
        >
          Actions
        </q-item-label>

        <ButtonSettings
          v-model:versions="versions"
          v-model:currentVersion="currentVersion"
        />

        <q-separator spaced />

        <ButtonSync
          v-model="buildList"
          :current-version="currentVersion"
          @update:buildList="sortBuilds"
        />

        <q-item
          v-ripple
          clickable
          @click="sortBuilds"
        >
          <q-item-section avatar>
            <q-icon
              color="white"
              name="mdi-sort-ascending"
            />
          </q-item-section>
          <q-item-section>
            Sort
          </q-item-section>
        </q-item>

        <ButtonRandomize
          v-model="buildList"
          :current-version="currentVersion"
          @update:buildList="sortBuilds"
        />

        <ButtonCleanup
          v-model="buildList"
          :current-version="currentVersion"
          @update:buildList="saveBuilds"
        />

        <q-separator spaced />

        <q-item
          v-ripple
          clickable
          @click="saveBuilds"
        >
          <q-item-section avatar>
            <q-icon
              color="white"
              name="mdi-content-save"
            />
          </q-item-section>
          <q-item-section>
            Save
          </q-item-section>
        </q-item>

        <q-separator spaced />

        <q-item-label
          header
          class="text-h6"
        >
          Filters:
        </q-item-label>

        <q-item>
          <q-item-section>
            <q-item-label>Show outdated</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-toggle
              v-model="filters.showOutdated"
              val="Show outdated"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-drawer
      v-model="rightDrawerOpen"
      show-if-above
      side="right"
      behavior="desktop"
      bordered
    >
      <!-- drawer content -->
    </q-drawer>

    <q-page-container>
      <q-card
        v-for="buildtype in buildList"
        :key="buildtype.type"
        class="buildlist"
      >
        <q-card-section>
          <q-toolbar :id="buildtype.type">
            <q-toolbar-title class="text-h4">
              {{ typeName(buildtype.type) }}
            </q-toolbar-title>
            <q-btn
              color="green"
              @click="addBuild(buildtype.type)"
            >
              Add build
            </q-btn>
          </q-toolbar>
        </q-card-section>
        <q-card-section>
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
        </q-card-section>
      </q-card>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import axios from 'axios'
import compareVersions from 'compare-versions'
import { intersection, isArray } from 'lodash-es'
import { firstBy } from 'thenby'
import { type Ref, defineComponent, ref } from 'vue'
import { useToast } from 'vue-toastification'
import Build from '@/components/Build.vue'
import ButtonCleanup from '@/components/ButtonCleanup.vue'
import ButtonRandomize from '@/components/ButtonRandomize.vue'
import ButtonSettings from '@/components/ButtonSettings.vue'
import ButtonSync from '@/components/ButtonSync.vue'
import { BuildClass } from '@/lib/BuildClass'
import { type BuildList, type BuildTypes, type Versions } from '@/lib/dataTypes'
import { useStore } from '@/store/authors'

const getBuildTypeBuilds = (buildList: BuildList, buildType: string) => {
  const buildTypeIndex = buildList.findIndex((element) => {
    return element.type === buildType
  })
  return buildList[buildTypeIndex].builds
}

export default defineComponent({
  name: 'MainComponent',
  components: {
    Build,
    ButtonCleanup,
    ButtonRandomize,
    ButtonSettings,
    ButtonSync,
  },

  async setup () {
    const leftDrawerOpen = ref(false)
    const rightDrawerOpen = ref(false)

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
      leftDrawerOpen,
      toggleLeftDrawer () {
        leftDrawerOpen.value = !leftDrawerOpen.value
      },

      rightDrawerOpen,
      toggleRightDrawer () {
        rightDrawerOpen.value = !rightDrawerOpen.value
      },
      toast,
      types: data.types,
      buildList: ref(buildList),
      versions: ref(data.versions),
      currentVersion: ref(data.currentVersion),
      filters: ref({
        showOutdated: false,
      }),
    } as AppData
  },
  methods: {
    typeName (typeID: string) {
      return this.types[typeID]
    },
    outdated (versions: string[] | undefined) {
      // If build version list has current => not outdated, else check for compatible
      if (versions?.includes(this.currentVersion)) {
        return false
      } else {
        const versionData = this.versions.find((version) => {
          return version.version === this.currentVersion
        })
        if (versionData?.compatible && isArray(versionData.compatible)) {
          return intersection(versionData.compatible, versions).length === 0
        }
      }

      return true
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
          /* eslint-disable @typescript-eslint/indent */
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
        /* eslint-enable @typescript-eslint/indent */

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

        this.versions[this.versions.length - 1].skiprf = !rfBuilds.has(this.currentVersion)

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
          .catch((error) => {
            this.toast.error(error.message)
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
  buildList: Ref<BuildList>;
  currentVersion: Ref<string>;
  versions: Ref<Versions[]>;
  filters: Ref<{
    showOutdated: boolean;
  }>;
}
</script>

<style lang="scss" scoped>
.buildlist__item + .buildlist__item {
  margin-top: 1rem;
}
</style>
