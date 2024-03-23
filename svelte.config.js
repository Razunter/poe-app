// eslint-disable-next-line canonical/filename-match-exported
import adapter from '@sveltejs/adapter-node'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: vitePreprocess({
    scss: {
      includePaths: ['./src/css'],
      renderSync: true,
    },
    // Broken
    // babel: {
    //   sourceMaps: true,
    //   presets: [
    //     [
    //       '@babel/preset-env',
    //       {
    //         loose: true,
    //         // No need for babel to resolve modules
    //         modules: false,
    //         targets: {
    //           // ! Very important. Target es6+
    //           esmodules: true,
    //         },
    //       },
    //     ],
    //   ],
    // },
  }),

  kit: {
    adapter: adapter(),

    alias: {
      $components: 'src/components',
      $css: 'src/css',
    },
  },
}

export default config
