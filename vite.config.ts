import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [sveltekit()],
  css: {
    preprocessorOptions: {
      scss: {
        // prependData: `@import '/src/css/variables.scss';`,
        quietDeps: true,
      },
    },
  },
})
