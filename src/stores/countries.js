import { defineStore } from 'pinia'
import api from '@/api/axios'

export const useCountriesStore = defineStore('countries', {
  state: () => ({
    items: [],
    loading: false,
    error: null,
  }),

  getters: {
    getById: state => id => state.items.find(i => i.id === id),
  },

  actions: {
    async fetchAll () {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.get('/country')
        this.items = Array.isArray(data) ? data : []
        return data
      } catch (error) {
        this.error = error
        console.log(error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchOne (id) {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.get(`/country/${id}`)
        return data
      } catch (error) {
        this.error = error
        console.log(error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async create (payload) {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.post('/country', payload)
        // server returns created country
        if (data) {
          this.items.push(data)
        }
        return data
      } catch (error) {
        this.error = error
        console.log(error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async update (id, payload) {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.patch(`/country/${id}`, payload)
        const idx = this.items.findIndex(i => i.id === data.id)
        if (idx === -1) {
          this.items.push(data)
        } else {
          this.items.splice(idx, 1, data)
        }
        return data
      } catch (error) {
        this.error = error
        console.log(error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async remove (id) {
      this.loading = true
      this.error = null
      try {
        await api.delete(`/country/${id}`)
        const idx = this.items.findIndex(i => i.id === id)
        if (idx === -1) {
          return true
        }
        this.items.splice(idx, 1)
        return true
      } catch (error) {
        this.error = error
        console.log(error)
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})
