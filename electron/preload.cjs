const { contextBridge, ipcRenderer } = require('electron')

const validChannels = new Set([
  'whatsapp:init', 'whatsapp:status', 'whatsapp:info', 'whatsapp:start-broadcast',
])
const validReceiveChannels = new Set([
  'whatsapp:qr', 'whatsapp:ready', 'whatsapp:authenticated', 'whatsapp:disconnected',
  'whatsapp:auth_failure', 'whatsapp:broadcast-status',
])

contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel, ...args) => validChannels.has(channel) ? ipcRenderer.invoke(channel, ...args) : undefined,
  on: (channel, callback) => {
    if (!validReceiveChannels.has(channel)) {
      return
    }
    const newCallback = (event, ...args) => callback(...args)
    ipcRenderer.on(channel, newCallback)
    return () => ipcRenderer.removeListener(channel, newCallback)
  },
  removeAllListeners: channel => {
    if (validReceiveChannels.has(channel)) {
      ipcRenderer.removeAllListeners(channel)
    }
  },
})
