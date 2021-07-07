<template>
  <div class="container">
    <md-app>
      <md-app-toolbar class="md-primary">
        <span class="md-title">Razunter's PoE Builds admin panel</span>
      </md-app-toolbar>
      <md-app-drawer md-permanent="full">
        <md-toolbar class="md-transparent" md-elevation="0">
          Navigation
        </md-toolbar>

        <md-list>
          <md-list-item>
            <md-icon>move_to_inbox</md-icon>
            <span class="md-list-item-text">Inbox</span>
          </md-list-item>

          <md-list-item>
            <md-icon>send</md-icon>
            <span class="md-list-item-text">Sent Mail</span>
          </md-list-item>

          <md-list-item>
            <md-icon>delete</md-icon>
            <span class="md-list-item-text">Trash</span>
          </md-list-item>

          <md-list-item @click="saveBuilds">
            <md-icon>save</md-icon>
            <span class="md-list-item-text">Save</span>
          </md-list-item>
        </md-list>
      </md-app-drawer>
      <md-app-content>
        <section
          v-for="buildtype in buildList"
          :key="buildtype.type"
          class="buildlist"
        >
          <h2 class="buildlist__group__title">
            {{ typeName(buildtype.type) }}
          </h2>
          <draggable v-model="buildtype.builds" tag="ol">
            <li
              v-for="(build, index) in buildtype.builds"
              :key="build.url"
              class="buildlist__item"
            >
              <Build
                :build="build"
                :build-type="typeName(buildtype.type)"
                :outdated="outdated(build.versions)"
                @update:build="updateBuild($event, buildtype.type, index)"
              />
            </li>
          </draggable>
        </section>
      </md-app-content>
    </md-app>
    <md-snackbar
      :md-duration="toast.duration"
      :md-active.sync="toast.show"
      md-persistent
    >
      <span v-html="toast.message" /> <!-- eslint-disable-line -->
      <md-button class="md-primary" @click="toast.show = false">
        Close
      </md-button>
    </md-snackbar>
  </div>
</template>

<script>
import draggable from 'vuedraggable'
import Build from '@/components/Build'

export default {
  components: {
    draggable,
    Build
  },
  async asyncData ({ $http }) {
    const data = await $http.$get('/api/load')
    return {
      types: data.types,
      buildList: data.buildList,
      currentVersion: data.currentVersion
    }
  },
  data () {
    return {
      types: {},
      buildList: [],
      currentVersion: '',
      toast: {
        show: false,
        duration: 4000,
        message: ''
      }
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
      const typeIndex = this.buildList.findIndex((element) => {
        return element.type === type
      })
      this.buildList[typeIndex].builds[index] = event
    },
    saveBuilds () {
      // Validation Start
      const duplicateUrls = []
      let flatBuildList = []
      this.buildList.forEach((buildcat) => {
        flatBuildList = flatBuildList.concat(buildcat.builds)
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
          types: this.types,
          buildList: this.buildList
        }

        async function saveToData (buildList, $http) {
          await $http.$post('/api/save', buildList)
        }

        saveToData(buildListFull, this.$http)
        this.toast = {
          duration: 4000,
          show: true,
          message: 'Saved'
        }
      } else {
        let log = ''
        duplicateUrls.forEach((elem) => {
          log += '<p>' + elem.join('<br />') + '</p>'
        })
        this.toast = {
          show: true,
          duration: Infinity,
          message: '<strong>Duplicate URLs detected:</strong><br />' + log
        }
      }
    }
  }
}
</script>

<style lang="scss">
body {
  font-size: 18px;
}

.container {
  margin: 0 auto;
  width: 1920px;
  padding: 0 20px;
}

.md-app {
  min-height: 100vh;
}

.md-toolbar.md-theme-default.md-primary {
  background: #35495e;
}

.md-snackbar {
  max-height: unset;
}
</style>

<style lang="scss" scoped>
.buildlist__item + .buildlist__item {
  margin-top: 1rem;
}
</style>
