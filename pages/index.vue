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
          <h2>{{ buildtype.type }}</h2>
          <draggable tag="ol" :list="buildtype.builds">
            <li v-for="build in buildtype.builds" :key="build.url">
              {{ build }}
            </li>
          </draggable>
        </section>
      </md-app-content>
    </md-app>
  </div>
</template>

<script>
import draggable from 'vuedraggable'

export default {
  components: {
    draggable
  },
  async asyncData ({ $http }) {
    const data = await $http.$get('/api/load')
    const {
      types,
      buildlist
    } = data
    return {
      types,
      buildList: buildlist
    }
  },
  data () {
    return {
      types: {},
      buildList: []
    }
  },
  methods: {
    async saveBuilds () {
      const buildListFull = {
        types: this.types,
        buildlist: this.buildList
      }
      // console.log(buildlistObj)
      await this.$http.$post('/api/save', buildListFull)
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
</style>
