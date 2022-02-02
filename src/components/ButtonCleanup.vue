<template>
  <q-item
    v-ripple
    clickable
    @click="cleanupBuilds"
  >
    <q-item-section avatar>
      <q-icon
        color="white"
        name="mdi-delete"
      />
    </q-item-section>
    <q-item-section>
      Cleanup
    </q-item-section>
  </q-item>
</template>

<script lang="ts">
import type { PropType } from 'vue'
import { defineComponent } from 'vue'
import type { BuildList } from '@/lib/dataTypes'

const versionInt = (versionString: string) => {
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
        return [] as BuildList
      },
      type: Array as PropType<BuildList>,
    },
    currentVersion: {
      type: String,
      default: '',
    },
  },
  methods: {
    outdated (versions: string[]) {
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
