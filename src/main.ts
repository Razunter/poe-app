import { createPinia } from 'pinia'
import { type QuasarPluginOptions, Quasar } from 'quasar'
import quasarIconSet from 'quasar/icon-set/svg-mdi-v6'
import { createApp } from 'vue'
import Toast, { type PluginOptions, POSITION } from 'vue-toastification'
// eslint-disable-next-line import/no-unassigned-import
import 'vue-toastification/dist/index.css'
import App from './App.vue'

// Import icon libraries
// eslint-disable-next-line import/no-unassigned-import
import '@quasar/extras/mdi-v6/mdi-v6.css'

// Import Quasar css
// eslint-disable-next-line import/no-unassigned-import
import 'quasar/src/css/index.sass'

const app = createApp(App)
  .use(Toast, {
    position: POSITION.BOTTOM_CENTER,
  } as PluginOptions)
  .use(Quasar, {
    plugins: {
      Dark: {},
    },
    iconSet: quasarIconSet,
    /*
    config: {
      brand: {
        // primary: '#e46262',
        // ... or all other brand colors
      },
      notify: {...}, // default set of options for Notify Quasar plugin
      loading: {...}, // default set of options for Loading Quasar plugin
      loadingBar: { ... }, // settings for LoadingBar Quasar plugin
      // ..and many more (check Installation card on each Quasar component/directive/plugin)
    }
    */
  } as Partial<QuasarPluginOptions>)
  .use(createPinia())

app.mount('#app')
