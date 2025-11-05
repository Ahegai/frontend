import { defineStore } from 'pinia'
import api from '@/api/axios'

export const useWhatsappStore = defineStore('whatsapp', {
  state: () => ({
    connected: false,
    info: null,
    error: null,
  }),

  getters: {
    isConnected: state => !!state.connected,
  },

  actions: {
    async fetchInfo () {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.get('/whatsapp/info')
        this.connected = Boolean(data.pushname)
        this.info = data ?? null
        return data
      } catch (error) {
        this.error = error
        console.error('Failed to fetch WhatsApp info', error)
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})
