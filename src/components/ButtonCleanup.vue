<template>
  <v-list-item @click="cleanupBuilds">
    <v-list-item-icon>
      <v-icon>mdi-delete</v-icon>
    </v-list-item-icon>
    <v-list-item-content>
      <v-list-item-title>Cleanup</v-list-item-title>
    </v-list-item-content>
  </v-list-item>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

const versionInt = (versionString) => {
  const vArray = versionString.split('.')
  for (const [index, vArrayItem] of vArray.entries()) {
    if (vArrayItem.length < 2) {
      vArray[index] = '0' + vArrayItem
    }
  }

  return Number.parseInt(vArray.join(''), 10)
}

export default defineComponent({
  props: {
    buildList: {
      default: () => {
        return []
      },
      type: Array,
    },
    currentVersion: {
      type: String,
      default: '',
    },
  },
  methods: {
    outdated (versions) {
      if (versions) {
        return !versions.includes(this.currentVersion)
      } else {
        return true
      }
    },
    cleanupBuilds () {
      for (const buildCat of this.buildList) {
        for (const [index, build] of buildCat.builds.entries()) {
          if (this.outdated(build.versions)) {
            // YT-only
            if (build.url.includes('youtube.com')) {
              buildCat.builds.splice(index, 1)
            }

            // Very outdated
            const lastV = versionInt(build.versions[build.versions.length - 1])
            const currentVersionInt = versionInt(this.currentVersion)
            if (lastV < currentVersionInt - 2) {
              buildCat.builds.splice(index, 1)
            }
          }
        }
      }

      this.$emit('update:buildList', this.buildList)
    },
  },
})
</script>
