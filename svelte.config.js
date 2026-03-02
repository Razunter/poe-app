// eslint-disable-next-line canonical/filename-match-exported
import adapter from '@sveltejs/adapter-node'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: [vitePreprocess()],

  kit: {
    adapter: adapter(),

    csrf: {
      trustedOrigins: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    },

    experimental: {
      remoteFunctions: true,
    },

    alias: {
      $components: 'src/components',
      $css: 'src/css',
    },
  },

  compilerOptions: {
    experimental: {
      async: true,
    },
  },
}

export default config
