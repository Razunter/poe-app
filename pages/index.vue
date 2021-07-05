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
        <section v-for="buildtype in buildList" :key="buildtype.type">
          <h2>{{ typeName(buildtype.type) }}</h2>
          <draggable v-model="buildtype.builds" tag="ol">
            <li v-for="(build, index) in buildtype.builds" :key="build.url">
              <Build
                :build="build"
                :build-type="typeName(buildtype.type)"
                :outdated="outdated(build.versions)"
                :build-list="buildList"
                @update:build="updateBuild($event, buildtype.type, index)"
              />
            </li>
          </draggable>
        </section>
      </md-app-content>
    </md-app>
  </div>
</template>

<script>
import draggable from 'vuedraggable'
import Build from '@/components/Build'

const saveToData = async (buildList) => {
  await this.$http.$post('/api/save', buildList)
}

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
      currentVersion: ''
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
        if (map[flatBuildList[i].url]) {
          duplicateUrls.push(flatBuildList[i].title)
          // terminate the loop
          break
        }
        // add entry in object with the element as key
        map[flatBuildList[i].url] = true
      }
      console.log(duplicateUrls)
      // Validation End

      if (duplicateUrls.length === 0) {
        const buildListFull = {
          currentVersion: this.currentVersion,
          types: this.types,
          buildList: this.buildList
        }
        saveToData(buildListFull)
      }
    }
  }
}
</script>

<style scoped lang="scss">
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
</style>
