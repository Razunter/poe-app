<template>
  <v-list-item @click="randomizeBuilds">
    <v-list-item-icon>
      <v-icon>mdi-sync</v-icon>
    </v-list-item-icon>
    <v-list-item-content>
      <v-list-item-title>Randomize order</v-list-item-title>
    </v-list-item-content>
  </v-list-item>
</template>

<script>
import _random from 'lodash.random'

export default {
  props: {
    buildList: {
      default: () => {
        return []
      },
      type: Array
    },
    currentVersion: {
      type: String,
      default: ''
    }
  },
  methods: {
    outdated (versions) {
      if (versions) {
        return !versions.includes(this.currentVersion)
      } else {
        return true
      }
    },
    randomizeBuilds () {
      this.buildList.forEach((buildcat) => {
        buildcat.builds.sort((buildA, buildB) => {
          let sortValue = 0
          sortValue = _random(-100, 100)
          return sortValue
        })
      })
      this.$emit('update:buildList', this.buildList)
    }
  }
}
</script>
