// Использует import вместо const ... = require
import { contextBridge, ipcRenderer } from 'electron'

// "Белый список" каналов, по которым Vue может общаться с Electron
const validChannels = new Set([
  'whatsapp:init',
  'whatsapp:status',
  'whatsapp:info',
  'whatsapp:start-broadcast',
])

// "Белый список" каналов, которые Vue может слушать
const validReceiveChannels = new Set([
  'whatsapp:qr',
  'whatsapp:ready',
  'whatsapp:authenticated',
  'whatsapp:disconnected',
  'whatsapp:auth_failure',
  'whatsapp:broadcast-status',
])

contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel, ...args) => {
    if (validChannels.has(channel)) {
      return ipcRenderer.invoke(channel, ...args)
    }
    console.error(`[Preload] Недопустимый канал invoke: ${channel}`)
  },

  on: (channel, callback) => {
    if (validReceiveChannels.has(channel)) {
      const newCallback = (event, ...args) => callback(...args)
      ipcRenderer.on(channel, newCallback)

      return () => {
        ipcRenderer.removeListener(channel, newCallback)
      }
    }
    console.error(`[Preload] Недопустимый канал on: ${channel}`)
  },

  removeAllListeners: channel => {
    if (validReceiveChannels.has(channel)) {
      ipcRenderer.removeAllListeners(channel)
    }
  },
})
