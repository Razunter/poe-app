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
        nav
      >
        <button-settings
          :versions.sync="versions"
          :current-version.sync="currentVersion"
        />

        <v-divider />

        <v-list-item @click="sortBuilds">
          <v-list-item-icon>
            <v-icon>mdi-sort-ascending</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Sort</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <button-randomize
          :build-list.sync="buildList"
          :current-version="currentVersion"
          @update:buildList="sortBuilds"
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

      <v-card outlined width="100%">
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
        <v-tabs show-arrows>
          <v-tab
            v-for="(buildType, buildKey) in types"
            :key="buildKey"
            @click="$vuetify.goTo('#'+buildKey)"
          >
            {{ buildType }}
          </v-tab>
        </v-tabs>
      </template>
    </v-app-bar>
    <v-main>
      <v-card
        v-for="buildtype in filteredBuilds"
        :key="buildtype.type"
        class="buildlist"
      >
        <v-card-title :id="buildtype.type" class="buildlist__group__title">
          {{ typeName(buildtype.type) }}
        </v-card-title>
        <v-card-actions>
          <v-btn color="green" @click="addBuild(buildtype.type)">
            Add build
          </v-btn>
        </v-card-actions>
        <v-card-text>
          <draggable v-model="buildtype.builds">
            <transition-group name="buildlist-tr" tag="ol">
              <li
                v-for="(build, index) in buildtype.builds"
                :key="build.url + index"
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
              </li>
            </transition-group>
          </draggable>
        </v-card-text>
      </v-card>
    </v-main>
    <v-snackbar
      v-model="toast.show"
      app
      multi-line
      :timeout="toast.duration"
      vertical
    >
      <span v-html="toast.message" /> <!-- eslint-disable-line -->
      <template #action="{ attrs }">
        <v-btn text v-bind="attrs" @click="toast.show = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script>
import draggable from 'vuedraggable'
import Build from '@/components/Build'
import compareVersions from 'compare-versions'

const getBuildTypeBuilds = (buildList, buildType) => {
  const buildTypeIndex = buildList.findIndex((element) => {
    return element.type === buildType
  })
  return buildList[buildTypeIndex].builds
}

function BuildObj ({
  title = '',
  url = '',
  video = '',
  videothumb = '',
  versions = [],
  author = '',
  pin = ''
}) {
  this.title = title
  this.url = url
  this.video = video
  this.videothumb = videothumb
  this.versions = versions
  this.author = author
  this.pin = pin
}

export default {
  components: {
    draggable,
    Build
  },
  async asyncData ({
    $http,
    store
  }) {
    const data = await $http.$get('/api/load')
    const buildList = data.buildList
    buildList.forEach((buildCat) => {
      buildCat.builds.forEach((build) => {
        if (!build.author) {
          build.author = ''
        }
      })
    })
    // const allAuthors = new Set()
    buildList.forEach((buildCat) => {
      buildCat.builds.forEach((build) => {
        if (build.author) {
          store.commit('add', build.author)
        }
      })
    })
    return {
      types: data.types,
      buildList,
      versions: data.versions,
      currentVersion: data.currentVersion
    }
  },
  data () {
    return {
      types: {},
      buildList: [],
      currentVersion: '',
      versions: [],
      toast: {
        show: false,
        duration: 4000,
        message: ''
      },
      filters: {
        showOutdated: true
      }
    }
  },
  computed: {
    filteredBuilds () {
      const filteredBuilds = []
      this.buildList.forEach((buildCat) => {
        const filteredCat = buildCat.builds.filter((build) => {
          if (!this.filters.showOutdated) {
            return !this.outdated(build.versions)
          } else {
            return true
          }
        })
        filteredBuilds.push({
          type: buildCat.type,
          builds: filteredCat
        })
      })
      return filteredBuilds
    }
  },
  methods: {
    typeName (typeID) {
      return this.types[typeID]
    },
    outdated (versions) {
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
    updateBuild (event, type, index) {
      getBuildTypeBuilds(this.buildList, type)[index] = event
      if (event.author) {
        this.$store.commit('add', event.author)
      }
    },
    deleteBuild (buildType, index) {
      getBuildTypeBuilds(this.buildList, buildType).splice(index, 1)
    },
    addBuild (buildType) {
      getBuildTypeBuilds(this.buildList, buildType).unshift(new BuildObj({
        versions: [this.currentVersion]
      }))
      this.$nextTick(() => {
        this.$refs[`build-${buildType}-0`][0].showDialog = true
      })
    },
    sortBuilds () {
      this.buildList.forEach((buildcat) => {
        buildcat.builds.sort((buildA, buildB) => {
          let sortValue = 0
          // Sort by version
          if (this.outdated(buildA.versions) && !this.outdated(buildB.versions)) {
            sortValue = 1000
          } else if (!this.outdated(buildA.versions) && this.outdated(buildB.versions)) {
            sortValue = -1
          }
          // Sort by author
          if (buildA.author || buildB.author) {
            if (buildA.author && buildB.author && buildA.author !== buildB.author) {
              sortValue += buildA.author[0] > buildB.author[0] ? 1 : -1
            }
            if (buildA.author && !buildB.author) {
              sortValue += 1
            } else if (!buildA.author && buildB.author) {
              sortValue += -1
            }
          }

          // Sort by version
          const buildAVersionLatest = buildA.versions[buildA.versions.length - 1]
          const buildBVersionLatest = buildB.versions[buildB.versions.length - 1]
          sortValue -= compareVersions(buildAVersionLatest, buildBVersionLatest)

          // Sort pinned
          if (buildA.pin && !buildB.pin) {
            sortValue += -10
          } else if (!buildA.pin && buildB.pin) {
            sortValue += 10
          }
          return sortValue
        })
      })
    },
    saveBuilds () {
      // Validation Start
      const duplicateUrls = []
      let flatBuildList = []
      this.buildList.forEach((buildCat) => {
        flatBuildList = flatBuildList.concat(buildCat.builds)
      })
      const map = {}
      for (let i = 0; i < flatBuildList.length; i++) {
        // check if object contains entry with this element as key
        if (Number.isInteger(map[flatBuildList[i].url])) {
          duplicateUrls.push([flatBuildList[i].title, flatBuildList[map[flatBuildList[i].url]].title])
          // terminate the loop
          break
        }
        // add entry in object with the element as key
        map[flatBuildList[i].url] = i
      }
      // Validation End

      if (duplicateUrls.length === 0) {
        const buildListFull = {
          currentVersion: this.currentVersion,
          versions: this.versions,
          types: this.types,
          buildList: this.buildList
        };

        (async function (buildList, $http) {
          await $http.$post('/api/save', buildList)
        })(buildListFull, this.$http).then(() => {
          this.toast = {
            duration: 4000,
            show: true,
            message: 'Saved'
          }
        })
      } else {
        let log = ''
        duplicateUrls.forEach((elem) => {
          log += '<p>' + elem.join('<br />') + '</p>'
        })
        this.toast = {
          show: true,
          duration: -1,
          message: '<strong>Duplicate URLs detected:</strong><br />' + log
        }
      }
    }
  }
}
</script>

<style lang="scss">
.buildlist-tr-move {
  transition: transform .5s;
}
</style>

<style lang="scss" scoped>
.buildlist {
  padding: 0 2rem;
}

.buildlist__item + .buildlist__item {
  margin-top: 1rem;
}
</style>
