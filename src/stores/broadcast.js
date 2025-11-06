// src/stores/broadcast.js
import { defineStore } from 'pinia'
import axios from '@/api/axios'

import {
  applyVariations,
} from '@/utils/spintax.dictionary'

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
    async fetchAll () {
      this.loading = true
      this.error = null
      try {
        const { data } = await axios.get('/broadcast')
        this.items = Array.isArray(data) ? data : []
        return data
      } catch (error) {
        this.error = error
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchOne (id) {
      this.error = null
      try {
        const { data } = await axios.get(`/broadcast/${id}`)
        return data
      } catch (error) {
        this.error = error
        throw error
      }
    },

    /**
     * 1. Запуск рассылки
     */
    async pushBroadcast (payload) {
      try {
        console.log('Store: Вызов electronAPI.invoke("whatsapp:start-broadcast")')
        const response = await api.invoke('whatsapp:start-broadcast', payload)
        if (!response.success) {
          throw new Error(response.message)
        }
        this.logs.push(`[INFO] ${response.message}`)
      } catch (error) {
        console.error('Ошибка pushBroadcast:', error)
        this.status = 'error'
        this.logs.push(`[ERROR] ${error.message}`)
      }
    },

    async send (payload) {
      try {
        this.status = 'running'
        this.initializeListeners()
        const response = await axios.post('/broadcast/clients', payload)
        const clients = response.data.clients
        // sendEvent('whatsapp:broadcast-status', { type: 'start', total: clients.length })
        for (const client of clients) {
          try {
            const uniqueMessage = applyVariations(payload.message)
            let mediaParam
            if (payload.media) {
              mediaParam = { ...payload.media }
              if (typeof (payload.media).buffer === 'string') {
                try {
                  mediaParam.buffer = Buffer.from(
                    (payload.media).buffer,
                    'base64',
                  )
                } catch {
                  // leave as-is; sendMessage will validate
                }
              }
            }

            this.pushBroadcast({
              phone: client.phone,
              message: uniqueMessage,
              media: mediaParam,
            })

            const minDelay = payload.timing.from * 1000 // Минимальная задержка в миллисекундах (1 секунда)
            const maxDelay = payload.timing.for * 1000 // Максимальная задержка в миллисекундах (10 секунд)
            const randomDelay
              = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay
            await new Promise(res => setTimeout(res, randomDelay))
          } catch {
            console.log('failed to send')
          }
        }
      } catch (error) {
        console.error('Ошибка sendBroadcast:', error)
        this.status = 'error'
        this.logs.push(`[ERROR] ${error.message}`)
      }
      // sendEvent('whatsapp:broadcast-status', { type: 'complete', successCount, errorCount })
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
