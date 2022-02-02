<template>
  <Suspense>
    <Main />
  </Suspense>
</template>

<script lang="ts">
import { useQuasar } from 'quasar'
import { defineComponent } from 'vue'
import Main from '@/components/Main.vue'

export default defineComponent({
  name: 'App',
  components: {
    Main,
  },
  setup () {
    const $q = useQuasar()
    $q.dark.set(true)
  },
})
</script>
