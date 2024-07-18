import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [sveltekit()],
  css: {
    preprocessorOptions: {
      scss: {
        // prependData: `@import 'src/styles/variables.scss';`,
        quietDeps: true,
      },
    },
  },
})
