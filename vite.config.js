// eslint-disable-next-line canonical/filename-match-exported
import { sveltekit } from '@sveltejs/kit/vite'

// eslint-disable-next-line jsdoc/valid-types
/** @type {import('vite').UserConfig} */
const config = {
  plugins: [sveltekit()],
}

export default config
