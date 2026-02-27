import axios from 'axios'

// API calls use relative URLs — nginx proxies /api/* to the backend container.
// This works in every environment (local Docker, staging, prod) with no rebuild.
// VITE_API_URL is kept as an optional override for local non-Docker dev
// (e.g. `npm run dev` against a local backend on port 8080).
const BASE_URL = import.meta.env.VITE_API_URL || ''

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