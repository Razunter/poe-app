// eslint-disable-next-line canonical/filename-match-exported
import adapter from '@sveltejs/adapter-auto'
import preprocess from 'svelte-preprocess'

// eslint-disable-next-line jsdoc/valid-types
/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: preprocess({
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

    // Override http methods in the Todo forms
    methodOverride: {
      allowed: ['PATCH', 'DELETE'],
    },
  },
}

export default config
