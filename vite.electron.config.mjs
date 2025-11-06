import { builtinModules } from 'node:module'
import path from 'node:path'
import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron'

export default defineConfig({
  root: '.', // не ищем index.html
  plugins: [
    electron({
      main: {
        entry: 'electron/main.js',
        vite: {
          build: {
            rollupOptions: {
              external: [
                'electron',
                ...builtinModules,
                ...builtinModules.map(m => `node:${m}`),
              ],
              input: path.resolve(__dirname, 'electron/main.js'),
            },
            outDir: 'dist-electron',
            emptyOutDir: true,
          },
        },
      },
      preload: {
        input: path.resolve(__dirname, 'electron/preload.cjs'),
      },
      renderer: {}, // 👈 добавляем, чтобы он понял, что есть фронт отдельно
    }),
  ],
  build: {
    outDir: 'dist-electron',
    emptyOutDir: true,
  },
})
