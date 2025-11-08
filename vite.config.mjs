import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Fonts from 'unplugin-fonts/vite'
import Components from 'unplugin-vue-components/vite'
import { VueRouterAutoImports } from 'unplugin-vue-router'
import VueRouter from 'unplugin-vue-router/vite'
import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron'
import Layouts from 'vite-plugin-vue-layouts-next'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

export default defineConfig({
  plugins: [
    vue({
      template: { transformAssetUrls },
    }),

    VueRouter({
      dts: false,
    }),

    Layouts(),

    Vuetify({
      autoImport: true,
      styles: {
        configFile: 'src/styles/settings.scss',
      },
    }),

    Components({
      dts: false,
    }),

    Fonts({
      google: {
        families: [
          {
            name: 'Roboto',
            styles: 'wght@100;300;400;500;700;900',
          },
        ],
      },
    }),

    AutoImport({
      imports: [
        'vue',
        VueRouterAutoImports,
        {
          pinia: ['defineStore', 'storeToRefs'],
        },
      ],
      eslintrc: { enabled: true },
      vueTemplate: true,
      dts: false,
    }),

    // ⚙️ Главное изменение — добавляем external в electron build
    electron([
      {
        entry: 'electron/main.cjs',
        vite: {
          build: {
            rollupOptions: {
              input: 'electron/main.cjs',
              external: [
                'electron',
                'puppeteer',
                'whatsapp-web.js',
                '@perfsee/chrome-finder',
                'fs',
                'path',
              ],
            },
          },
        },
      },
      {
        entry: 'electron/preload.cjs',
        format: 'cjs',
        vite: {
          build: {
            rollupOptions: {
              input: 'electron/preload.cjs',
              external: ['electron'],
            },
          },
        },
      },
    ]),
  ],

  optimizeDeps: {
    exclude: [
      'vuetify',
      'vue-router',
      'unplugin-vue-router/runtime',
      'unplugin-vue-router/data-loaders',
      'unplugin-vue-router/data-loaders/basic',
    ],
  },

  define: { 'process.env': {} },

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
    },
    extensions: ['.js', '.json', '.jsx', '.mjs', '.vue'],
  },

  server: {
    port: 3000,
  },
})
