import { defineStore } from 'pinia'
import api from '@/api/axios'

export const useEventsStore = defineStore('events', {
  state: () => ({
    items: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchAll () {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.get('/events')
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
      try {
        const { data } = await api.get(`/events/${id}`)
        return data
      } catch (error) {
        this.error = error
        throw error
      }
    },

    async create (payload) {
      try {
        const { data } = await api.post('/events', payload)
        this.items.push(data)
        return data
      } catch (error) {
        this.error = error
        throw error
      }
    },

    async update (id, payload) {
      try {
        const { data } = await api.patch(`/events/${id}`, payload)
        const idx = this.items.findIndex(i => i.id === data.id)
        if (idx === -1) {
          this.items.push(data)
        } else {
          this.items.splice(idx, 1, data)
        }
        return data
      } catch (error) {
        this.error = error
        throw error
      }
    },

    async remove (id) {
      try {
        await api.delete(`/events/${id}`)
        const idx = this.items.findIndex(i => i.id === id)
        if (idx !== -1) {
          this.items.splice(idx, 1)
        }
        return true
      } catch (error) {
        this.error = error
        throw error
      }
    },
  },
})
