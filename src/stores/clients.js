import { defineStore } from 'pinia'
import api from '@/api/axios'

export const useClientsStore = defineStore('clients', {
  state: () => ({
    items: [],
    loading: false,
    error: null,
  }),

  actions: {
    async create (payload) {
      try {
        const { data } = await api.post('/clients', payload)
        this.items.push(data)
        return data
      } catch (error) {
        this.error = error
        throw error
      }
    },

    async fetchAll ({ page = 1, perPage = 10 } = {}) {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.get('/clients', {
          params: {
            page,
            per_page: perPage,
            perPage,
          },
        })
        // support multiple response shapes:
        // - plain array
        // - { items: [...], total: 123, total_pages: 13, page: 1 }
        // - { data: [...], totalItems: 123, totalPages: 13, page: 1 }
        // - { clients: [...], total_items: 123, total_pages: 13, current_page: 1 }
        if (Array.isArray(data)) {
          this.items = data
          return { items: data, total: data.length, total_pages: 1, page }
        }

        let items = []
        if (Array.isArray(data.items)) {
          items = data.items
        } else if (Array.isArray(data.data)) {
          items = data.data
        } else if (Array.isArray(data.clients)) {
          items = data.clients
        }

        this.items = items

        // pick total from several possible keys
        const total = data.total ?? data.totalItems ?? data.total_items ?? items.length
        const total_pages = data.total_pages ?? data.totalPages ?? Math.ceil(total / perPage)
        const pageRes = data.page ?? data.current_page ?? data.currentPage ?? page

        return {
          items,
          total,
          total_pages,
          page: pageRes,
        }
      } catch (error) {
        this.error = error
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchOne (id) {
      try {
        const { data } = await api.get(`/clients/${id}`)
        return data
      } catch (error) {
        this.error = error
        throw error
      }
    },

    async update (id, payload) {
      try {
        const { data } = await api.patch(`/clients/${id}`, payload)
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
        await api.delete(`/clients/${id}`)
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
