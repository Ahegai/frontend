// src/stores/broadcast.js
import { defineStore } from 'pinia'

// API теперь будет доступно глобально через preload
const api = window.electronAPI

export const useBroadcastStore = defineStore('broadcast', {
  state: () => ({
    logs: [], // Логи рассылки
    status: 'idle', // 'idle', 'running', 'complete', 'error'
    total: 0,
    success: 0,
    errors: 0,
  }),

  actions: {
    /**
     * 1. Запуск рассылки
     */
    async sendBroadcast (payload) {
      // payload = { message: '...', countryId: '...' }
      // 'media' пока не реализован в UI, но можно добавить

      try {
        this.status = 'running'
        this.logs = []
        this.total = 0
        this.success = 0
        this.errors = 0

        // Инициализируем слушатель статуса (на всякий случай)
        this.initializeListeners()

        console.log('Store: Вызов electronAPI.invoke("whatsapp:start-broadcast")')
        const response = await api.invoke('whatsapp:start-broadcast', payload)

        if (!response.success) {
          throw new Error(response.message)
        }

        // Ответ "запущено" пришел.
        // Дальнейший статус придет от слушателей
        this.logs.push(`[INFO] ${response.message}`)
      } catch (error) {
        console.error('Ошибка sendBroadcast:', error)
        this.status = 'error'
        this.logs.push(`[ERROR] ${error.message}`)
      }
    },

    /**
     * 2. Настройка слушателей Electron
     */
    initializeListeners () {
      // Используем api.on, но не будем дублировать, если уже вызвано
      // Можно добавить флаг, как в whatsapp.js

      // Очищаем старые слушатели на всякий случай
      api.removeAllListeners('whatsapp:broadcast-status')

      api.on('whatsapp:broadcast-status', event => {
        // event = { type: 'start', total: 10 }
        // event = { type: 'progress', phone: '...', status: 'success' }
        // event = { type: 'progress', phone: '...', status: 'error', message: '...' }
        // event = { type: 'complete', successCount: 9, errorCount: 1 }
        // event = { type: 'error', message: '...' }

        switch (event.type) {
          case 'start': {
            this.status = 'running'
            this.total = event.total
            this.logs.push(`[START] Рассылка запущена. Всего клиентов: ${event.total}`)
            break
          }

          case 'progress': {
            if (event.status === 'success') {
              this.success++
              this.logs.push(`[OK] ${event.phone}`)
            } else {
              this.errors++
              this.logs.push(`[FAIL] ${event.phone}: ${event.message}`)
            }
            break
          }

          case 'complete': {
            this.status = 'complete'
            this.logs.push(`[DONE] Рассылка завершена. Успешно: ${event.successCount}, Ошибок: ${event.errorCount}`)
            break
          }

          case 'error': {
            this.status = 'error'
            this.logs.push(`[FATAL ERROR] ${event.message}`)
            break
          }
        }
      })
    },
  },
})
