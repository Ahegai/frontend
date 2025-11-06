import path from 'node:path'
import { fileURLToPath } from 'node:url' // 👈 Для __dirname
// Используем import
import { app, BrowserWindow, ipcMain } from 'electron'
import { WhatsAppService } from './whatsapp.service.js' // 👈 .js

// === ВАЖНО: Исправление для __dirname в ES-модулях ===
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// ===

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

  ipcMain.handle('whatsapp:start-broadcast', async (event, payload) => {
    // ... (вся логика 'whatsapp:start-broadcast' остается без изменений)
    console.log('IPC: Получена команда whatsapp:start-broadcast')

    try {
      whatsappService.ensureReady()
    } catch (error) {
      console.error('WhatsApp не готов:', error.message)
      return { success: false, message: error.message }
    }

    runBroadcast(payload)

    return { success: true, message: `Рассылка запущена для клиентов` }
  })
}

// (Функция runBroadcast остается без изменений)
async function runBroadcast (payload) {
  const phone = payload.phone
  const message = payload.message
  const media = payload.media
  try {
    await whatsappService.sendMessage(phone, message, media)
    console.log('send')
  } catch (sendError) {
    console.error(`Ошибка отправки на ${phone}:`, sendError.message)
  }
}

// --- Код создания окна Electron ---

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // ✅ ИСПРАВЛЕНО: Путь идет "вверх" из 'electron' и "вниз" в 'dist-electron'
      contextIsolation: true,
      preload: path.join(__dirname, '/preload.cjs'),
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
