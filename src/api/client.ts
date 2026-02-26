import axios from 'axios'

// VITE_API_URL is injected at build time (or replaced at runtime via entrypoint script).
// Falls back to empty string so axios uses relative URLs (same-origin) as last resort.
const BASE_URL = import.meta.env.VITE_API_URL === '__VITE_API_URL_PLACEHOLDER__'
  ? ''
  : (import.meta.env.VITE_API_URL || '')

export const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('logbook_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Redirect to login on 401
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('logbook_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)