// eslint-disable-next-line canonical/filename-match-exported
import adapter from '@sveltejs/adapter-node'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: [vitePreprocess()],

  kit: {
    adapter: adapter(),

    alias: {
      $components: 'src/components',
      $css: 'src/css',
    },
  },
}

export default config
