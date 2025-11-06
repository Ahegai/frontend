import axios from 'axios'

const TOKEN_KEY = 'token'

// [ИЗМЕНЕНО] Используем localStorage
function getTokenStorage (name) {
  return localStorage.getItem(name)
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach token from localStorage if present
api.interceptors.request.use(config => {
  try {
    // [ИЗМЕНЕНО]
    const token = getTokenStorage(TOKEN_KEY)
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
