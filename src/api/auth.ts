import { client } from './client'
import type { User } from '../types'

export const authApi = {
  getMe: () =>
    client.get<User>('/api/auth/me').then(r => r.data),

  loginWithGoogle: () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/auth/login/google`
  },
}