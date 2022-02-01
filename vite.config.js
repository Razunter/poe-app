import path from 'path'
import vue from '@vitejs/plugin-vue'
import vuetify from '@vuetify/vite-plugin'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
    vuetify({
      autoImport: true,
    }),
  ],
  // define: {'process.env': {}},
  resolve: {
    alias: [
      {
        find: /^@(?=\/)/u,
        replacement: path.resolve('./src'),
      },
    ],
  },
  /* remove the need to specify .vue files https://vitejs.dev/config/#resolve-extensions
  resolve: {
    extensions: [
      '.js',
      '.json',
      '.jsx',
      '.mjs',
      '.ts',
      '.tsx',
      '.vue',
    ]
  },
  */
})
