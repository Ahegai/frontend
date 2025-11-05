import axios from 'axios'

const TOKEN_KEY = 'token'

function getCookie (name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach token from cookie if present
api.interceptors.request.use(config => {
  try {
    const token = getCookie(TOKEN_KEY)
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    } else if (config.headers && config.headers.Authorization) {
      // ensure no stale header
      delete config.headers.Authorization
    }
  } catch (error) {
    console.log(error)
    // ignore
  }
  return config
})

// Response interceptor: pass through, but could handle global errors here
api.interceptors.response.use(
  res => res,
  err => Promise.reject(err),
)

export default api
