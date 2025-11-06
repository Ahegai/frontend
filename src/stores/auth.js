import { defineStore } from 'pinia'
import api from '@/api/axios'

const TOKEN_KEY = 'token'

// [ИЗМЕНЕНО] Используем localStorage
function getTokenStorage (name) {
  return localStorage.getItem(name)
}

// [ИЗМЕНЕНО] Используем localStorage
function setTokenStorage (name, value) {
  if (value) {
    localStorage.setItem(name, value)
  } else {
    localStorage.removeItem(name)
  }
}

// [ИЗМЕНЕНО] Используем localStorage
function deleteTokenStorage (name) {
  localStorage.removeItem(name)
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    // [ИЗМЕНЕНО]
    token: getTokenStorage(TOKEN_KEY) || null,
  }),

  getters: {
    isAuthenticated: state => !!state.token,
  },

  actions: {
    init () {
      if (this.token) {
        // token is stored in localStorage; the API wrapper will read it from there
      }
    },

    setToken (token) {
      this.token = token
      console.log(token)
      if (token) {
        console.log('token set to localStorage')
        // [ИЗМЕНЕНО]
        setTokenStorage(TOKEN_KEY, token)
      } else {
        // wrapper will stop sending token when localStorage item is deleted
        console.log('token cleared from localStorage')
        // [ИЗМЕНЕНО]
        deleteTokenStorage(TOKEN_KEY)
      }
    },

    async login (payload) {
      try {
        const { data } = await api.post('/auth/login', payload)
        this.setToken(data.accessToken)
        this.user = data.user ?? null
        return data
      } catch (error) {
        console.log(error)
        throw error
      }
    },

    async register (payload) {
      try {
        const { data } = await api.post('/auth/register', payload)
        return data
      } catch (error) {
        console.log(error)
        throw error
      }
    },

    async fetchUser () {
      try {
        const { data } = await api.get('/auth/me')
        this.user = data
        return data
      } catch (error) {
        this.logout()
        throw error
      }
    },

    logout () {
      this.user = null
      this.setToken(null)
    },
  },
})
