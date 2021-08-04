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

<script>
const versionInt = (versionString) => {
  const vArr = versionString.split('.')
  vArr.forEach((vArrItem, index) => {
    if (vArrItem.length < 2) {
      vArr[index] = '0' + vArrItem
    }
  })
  return parseInt(vArr.join(''), 10)
}

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
    cleanupBuilds () {
      for (const buildCat of this.buildList) {
        buildCat.builds.forEach((build, index) => {
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
        })
      }
      this.$emit('update:buildList', this.buildList)
    }
  }
}
</script>
