const Module = require('node:module')
const path = require('node:path')
const { app, BrowserWindow, ipcMain } = require('electron')
const { WhatsAppService } = require('./whatsapp.service.js')

let mainWindow
const whatsappService = new WhatsAppService()

function getResourcePath (relativePath) {
  if (app.isPackaged) {
    const nodeModulesPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules')
    const originalRequire = Module._load
    Module._load = function (request, parent, isMain) {
      if (request.startsWith('whatsapp-web.js') || request.startsWith('puppeteer')) {
        return originalRequire(path.join(nodeModulesPath, request), parent, isMain)
      }
      return originalRequire(request, parent, isMain)
    }
  }
  return path.join(__dirname, relativePath)
}

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: { contextIsolation: true, preload: getResourcePath('preload.js') },
  })

  if (app.isPackaged) {
    mainWindow.loadFile(getResourcePath('../dist/index.html'))
  } else {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  }
}

function setupIpcHandlers () {
  const sendEventToVue = (channel, ...args) => mainWindow?.webContents?.send(channel, ...args)

  whatsappService.on('qr', qr => sendEventToVue('whatsapp:qr', qr))
  whatsappService.on('ready', () => sendEventToVue('whatsapp:ready'))
  whatsappService.on('authenticated', () => sendEventToVue('whatsapp:authenticated'))
  whatsappService.on('disconnected', reason => sendEventToVue('whatsapp:disconnected', reason))
  whatsappService.on('auth_failure', msg => sendEventToVue('whatsapp:auth_failure', msg))
  whatsappService.on('error', err => sendEventToVue('whatsapp:broadcast-status', { type: 'error', message: err }))

  ipcMain.handle('whatsapp:init', async () => {
    try {
      await whatsappService.initAuth(getResourcePath('sessions'))
      return { success: true, message: 'Инициализация запущена' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  ipcMain.handle('whatsapp:status', () => whatsappService.getStatus())
  ipcMain.handle('whatsapp:info', () => {
    try {
      return { success: true, data: whatsappService.getInfo() }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })

  ipcMain.handle('whatsapp:start-broadcast', async (event, payload) => {
    try {
      whatsappService.ensureReady()
      await whatsappService.sendMessage(payload.phone, payload.message, payload.media)
      return { success: true, message: 'Рассылка запущена' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  })
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
