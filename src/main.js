import Vue from 'vue'
import { ToastPlugin, ModalPlugin } from 'bootstrap-vue'
import VueCompositionAPI from '@vue/composition-api'

import * as Sentry from '@sentry/vue'
import { BrowserTracing } from '@sentry/tracing'
import { v4 as uuidv4 } from 'uuid'

import messages from '@/lang'

import VueI18n from 'vue-i18n'

import ChainAPI from '@/libs/fetch'

import router from './router'
import store from './store'
import App from './App.vue'

// Global Components
import './global-components'

// 3rd party plugins
import '@/libs/portal-vue'
import '@/libs/toastification'
import '@/libs/clipboard'

import { SENTRY_DSN } from './constants/config'

// Vue.use(VueGtag, { config: { id: 'UA-238887-1' } }, router)

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    Vue,
    dsn: SENTRY_DSN,
    integrations: [
      new BrowserTracing({
        routingInstrumentation: Sentry.vueRouterInstrumentation(router),
      }),
    ],
    release: process.env.VUE_APP_VERSION,
    environment: window.appConfig.PHASE,
    tracesSampleRate: 1.0,
  })
  Sentry.setUser({
    id: uuidv4(),
  })
}

Vue.use(VueI18n)

const i18n = new VueI18n({
  locale: 'en',
  messages,
  fallbackLocale: 'en',
})

// BSV Plugin Registration
Vue.use(ToastPlugin)
Vue.use(ModalPlugin)

// Composition API
Vue.use(VueCompositionAPI)

// import core styles
require('@core/scss/core.scss')

// import assets styles
require('@/assets/scss/style.scss')

Vue.config.productionTip = false
Vue.prototype.$http = new ChainAPI()

new Vue({
  router,
  store,
  i18n,
  render: h => h(App),
}).$mount('#app')
