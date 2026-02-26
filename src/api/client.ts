import axios from 'axios'

// Runtime config (injected by nginx from env vars) takes priority over build-time env
// This allows API_URL to be set as a Railway Variable without rebuilding
declare global {
  interface Window {
    __ENV__?: { API_URL?: string }
  }
}

const BASE_URL =
  window.__ENV__?.API_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8080'

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