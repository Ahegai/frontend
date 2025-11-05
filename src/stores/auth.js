import { defineStore } from 'pinia'
import api from '@/api/axios'

const TOKEN_KEY = 'token'

function getCookie (name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

function setCookie (name, value, days = 7) {
  const maxAge = days ? `;max-age=${days * 24 * 60 * 60}` : ''
  // eslint-disable-next-line unicorn/no-document-cookie
  document.cookie = `${name}=${encodeURIComponent(value || '')}${maxAge};path=/`
}

function deleteCookie (name) {
  // eslint-disable-next-line unicorn/no-document-cookie
  document.cookie = `${name}=;max-age=0;path=/`
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: getCookie(TOKEN_KEY) || null,
  }),

  getters: {
    isAuthenticated: state => !!state.token,
  },

  actions: {
    init () {
      if (this.token) {
        // token is stored in cookie; the API wrapper will read it from cookies
      }
    },

    setToken (token) {
      this.token = token
      console.log(token)
      if (token) {
        console.log('token set')
        setCookie(TOKEN_KEY, token)
      } else {
        // wrapper will stop sending token when cookie is deleted
        console.log('token cleared')
        deleteCookie(TOKEN_KEY)
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
