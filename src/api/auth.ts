import { client } from './client'
import type { User } from '../types'

export const authApi = {
  getMe: () =>
    client.get<User>('/api/auth/me').then(r => r.data),

  loginWithGoogle: () => {
    // Use a relative URL — nginx proxies /api/* to the backend.
    // This avoids hardcoding any hostname and works in every environment.
    window.location.href = '/api/auth/login/google'
  },
}