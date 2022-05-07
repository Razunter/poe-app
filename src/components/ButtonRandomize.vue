<template>
  <q-item
    v-ripple
    clickable
    @click="randomizeBuilds"
  >
    <q-item-section avatar>
      <q-icon
        color="white"
        name="mdi-sync"
      />
    </q-item-section>
    <q-item-section>
      Randomize order
    </q-item-section>
  </q-item>
</template>

<script lang="ts">
import { random } from 'lodash-es'
import { type PropType, defineComponent } from 'vue'
import { type BuildList } from '@/lib/dataTypes'

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
    outdated (versions: string[] | undefined) {
      if (versions) {
        return !versions.includes(this.currentVersion)
      } else {
        return true
      }
    },
    randomizeBuilds () {
      for (const buildcat of this.buildList) {
        buildcat.builds.sort(() => {
          let sortValue = 0
          sortValue = random(-100, 100)
          return sortValue
        })
      }

      this.$emit('update:buildList', this.buildList)
    },
  },
})
</script>
