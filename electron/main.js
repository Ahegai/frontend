import path from 'node:path'
import { fileURLToPath } from 'node:url' // 👈 Для __dirname
import axios from 'axios'
// Используем import
import { app, BrowserWindow, ipcMain } from 'electron'
import { WhatsAppService } from './whatsapp.service.js' // 👈 .js

// === ВАЖНО: Исправление для __dirname в ES-модулях ===
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// ===

const API_BASE_URL = 'http://localhost:8000'

let mainWindow
const whatsappService = new WhatsAppService()

function setupIpcHandlers () {
  const sendEventToVue = (channel, ...args) => {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send(channel, ...args)
    }
  }

  whatsappService.on('qr', qrImage => sendEventToVue('whatsapp:qr', qrImage))
  whatsappService.on('ready', () => sendEventToVue('whatsapp:ready'))
  // ... (все остальные обработчики .on() остаются без изменений)
  whatsappService.on('authenticated', () => sendEventToVue('whatsapp:authenticated'))
  whatsappService.on('disconnected', reason => sendEventToVue('whatsapp:disconnected', reason))
  whatsappService.on('auth_failure', msg => sendEventToVue('whatsapp:auth_failure', msg))
  whatsappService.on('error', err => sendEventToVue('whatsapp:broadcast-status', { type: 'error', message: err }))

  ipcMain.handle('whatsapp:init', async () => {
    console.log('IPC: Получена команда whatsapp:init')
    try {
      await whatsappService.initAuth()
      return { success: true, message: 'Инициализация запущена' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  ipcMain.handle('whatsapp:status', () => {
    console.log('IPC: Получена команда whatsapp:status')
    return whatsappService.getStatus()
  })

  ipcMain.handle('whatsapp:info', () => {
    console.log('IPC: Получена команда whatsapp:info')
    try {
      return { success: true, data: whatsappService.getInfo() }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  ipcMain.handle('whatsapp:start-broadcast', async (event, { message, media, countryId }) => {
    // ... (вся логика 'whatsapp:start-broadcast' остается без изменений)
    console.log('IPC: Получена команда whatsapp:start-broadcast')

    try {
      whatsappService.ensureReady()
    } catch (error) {
      console.error('WhatsApp не готов:', error.message)
      return { success: false, message: error.message }
    }

    let clients = []
    try {
      const url = new URL('/api/clients', API_BASE_URL)
      if (countryId) {
        url.searchParams.append('country_id', countryId)
      }

      console.log(`Запрос клиентов с: ${url.toString()}`)
      const response = await axios.get(url.toString())
      clients = response.data.data

      if (!Array.isArray(clients) || clients.length === 0) {
        throw new Error('API /clients не вернул список клиентов')
      }
    } catch (apiError) {
      console.error('Ошибка получения клиентов с API:', apiError.message)
      sendEventToVue('whatsapp:broadcast-status', { type: 'error', message: `Ошибка API: ${apiError.message}` })
      return { success: false, message: `Ошибка API: ${apiError.message}` }
    }

    runBroadcast(clients, message, media, sendEventToVue)

    return { success: true, message: `Рассылка запущена для ${clients.length} клиентов` }
  })
}

// (Функция runBroadcast остается без изменений)
async function runBroadcast (clients, message, media, sendEvent) {
  sendEvent('whatsapp:broadcast-status', { type: 'start', total: clients.length })

  let successCount = 0
  let errorCount = 0

  for (const client of clients) {
    const phone = client.phone
    if (!phone) {
      errorCount++
      sendEvent('whatsapp:broadcast-status', {
        type: 'progress',
        phone: 'N/A',
        status: 'error',
        message: 'У клиента нет номера',
      })
      continue
    }

    try {
      await whatsappService.sendMessage(phone, message, media)
      successCount++
      sendEvent('whatsapp:broadcast-status', { type: 'progress', phone, status: 'success' })
    } catch (sendError) {
      errorCount++
      console.error(`Ошибка отправки на ${phone}:`, sendError.message)
      sendEvent('whatsapp:broadcast-status', { type: 'progress', phone, status: 'error', message: sendError.message })
    }

    await new Promise(resolve => setTimeout(resolve, 3000))
  }

  console.log(`Рассылка завершена! Успешно: ${successCount}, Ошибок: ${errorCount}`)
  sendEvent('whatsapp:broadcast-status', { type: 'complete', successCount, errorCount })
}

// --- Код создания окна Electron ---

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // 👈 ВАЖНО: Указываем на .js
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  } else {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  }
}

app.whenReady().then(() => {
  setupIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', async () => {
  await whatsappService.destroy()
})
