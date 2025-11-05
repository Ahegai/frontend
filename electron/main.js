// electron/main.js

import path from 'node:path'
import { fileURLToPath } from 'node:url' // 1. Для получения __dirname
import { app, BrowserWindow } from 'electron'

// --- Воссоздаем __dirname и require ---
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

// --- Управление жизненным циклом (без изменений) ---

app.whenReady().then(async () => {
  try {
    createWindow()
  } catch (error) {
    console.error('ОШИБКА: Не удалось запустить Nest.js!', error)
    app.quit()
  }
})

app.on('before-quit', async event => {
  event.preventDefault()
  try {
    console.log('stopped')
  } catch (error) {
    console.error('Ошибка при остановке Nest.js:', error)
  } finally {
    app.exit(0)
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
