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

  /**
   * Saves the user's IANA timezone to the backend.
   * Called automatically on first login (when timezone is blank) and
   * explicitly from the Settings page when the user changes it.
   */
  updateTimezone: (timezone: string) =>
    client.patch<{ timezone: string }>('/api/auth/timezone', { timezone }).then(r => r.data),
}