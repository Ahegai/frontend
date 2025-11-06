// Используем 'require' вместо 'import'
const { contextBridge, ipcRenderer } = require('electron')

const validChannels = new Set(['whatsapp:init', 'whatsapp:status', 'whatsapp:info', 'whatsapp:start-broadcast'])
const validReceiveChannels = new Set(['whatsapp:qr', 'whatsapp:ready', 'whatsapp:authenticated', 'whatsapp:disconnected', 'whatsapp:auth_failure', 'whatsapp:broadcast-status'])

contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel, ...args) => {
    if (validChannels.has(channel)) {
      return ipcRenderer.invoke(channel, ...args)
    }
  },
  on: (channel, callback) => {
    if (validReceiveChannels.has(channel)) {
      const newCallback = (event, ...args) => callback(...args)
      ipcRenderer.on(channel, newCallback)
      return () => {
        ipcRenderer.removeListener(channel, newCallback)
      }
    }
  },
  removeAllListeners: channel => {
    if (validReceiveChannels.has(channel)) {
      ipcRenderer.removeAllListeners(channel)
    }
  },
})
