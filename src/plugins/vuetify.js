/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Composables
import { createVuetify } from 'vuetify'
// Styles
import '@mdi/font/css/materialdesignicons.css'

import 'vuetify/styles'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
// read saved theme from localStorage (fallback to 'light')
const savedTheme = (typeof window !== 'undefined' && window.localStorage)
  ? window.localStorage.getItem('vuetify:theme') || 'light'
  : 'light'

export default createVuetify({
  theme: {
    defaultTheme: savedTheme,
  },
})
