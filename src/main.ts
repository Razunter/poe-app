import { createPinia } from 'pinia'
import { createApp } from 'vue'
import type { PluginOptions } from 'vue-toastification'
import Toast, { POSITION } from 'vue-toastification'
// eslint-disable-next-line import/no-unassigned-import
import 'vue-toastification/dist/index.css'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import { loadFonts } from './plugins/webfontloader'

void loadFonts()

createApp(App)
  .use(Toast, {
    position: POSITION.BOTTOM_CENTER,
  } as PluginOptions)
  .use(createPinia())
  .use(vuetify)
  .mount('#app')
