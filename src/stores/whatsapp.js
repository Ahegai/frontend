// src/stores/whatsapp.js
import { defineStore } from 'pinia'

// API теперь будет доступно глобально через preload
const api = window.electronAPI

export const useWhatsappStore = defineStore('whatsapp', {
  state: () => ({
    qrCode: null,
    status: 'disconnected', // 'disconnected', 'initializing', 'ready', 'auth_failure'
    error: null,
    info: null,
    listenersInitialized: false, // Флаг, чтобы не дублировать слушатели
  }),

  actions: {
    // === Команды (Vue -> Electron) ===

    /**
     * 1. Запуск инициализации
     * (Замена POST /whatsapp/auth)
     */
    async initAuth () {
      try {
        this.status = 'initializing'
        this.qrCode = null
        this.error = null

        console.log('Store: Вызов electronAPI.invoke("whatsapp:init")')
        const response = await api.invoke('whatsapp:init')

        if (!response.success) {
          throw new Error(response.message)
        }

        // Дальнейший статус (qr, ready) придет от слушателей
      } catch (error) {
        console.error('Ошибка initAuth:', error)
        this.status = 'auth_failure'
        this.error = error.message
      }
    },

    /**
     * 2. Проверка статуса
     * (Замена GET /whatsapp/check)
     */
    async checkStatus () {
      try {
        const status = await api.invoke('whatsapp:status')
        this.isReady = status.isReady
        if (status.isReady) {
          this.status = 'ready'
        } else if (status.isInitializing) {
          this.status = 'initializing'
        } else {
          this.status = 'disconnected'
        }
      } catch (error) {
        console.error('Ошибка checkStatus:', error)
        this.status = 'disconnected'
      }
    },

    // ... (можно добавить getInfo, если нужно)

    // === Слушатели (Electron -> Vue) ===

    /**
     * 3. Настройка слушателей Electron
     * (Замена EventSource /whatsapp/qr)
     */
    initializeListeners () {
      // Запускаем только один раз
      if (this.listenersInitialized) {
        return
      }
      this.listenersInitialized = true

      console.log('Store: Инициализация слушателей Electron...')

      api.on('whatsapp:qr', qr => {
        console.log('Store: Получен QR-код')
        this.qrCode = qr
        this.status = 'initializing'
      })

      api.on('whatsapp:ready', () => {
        console.log('Store: Статус READY')
        this.qrCode = null
        this.status = 'ready'
        this.error = null
      })

      api.on('whatsapp:authenticated', () => {
        console.log('Store: Статус Authenticated')
        this.qrCode = null
        this.status = 'ready' // Считаем 'ready'
      })

      api.on('whatsapp:disconnected', reason => {
        console.warn('Store: Отключен:', reason)
        this.qrCode = null
        this.status = 'disconnected'
        this.error = 'WhatsApp отключен. ' + reason
      })

      api.on('whatsapp:auth_failure', message => {
        console.error('Store: Ошибка авторизации:', message)
        this.qrCode = null
        this.status = 'auth_failure'
        this.error = 'Ошибка авторизации: ' + message
      })
    },
  },
})
