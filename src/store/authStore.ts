import { create } from 'zustand'
import type { User } from '../types'
import { authApi } from '../api/auth'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  previousUsers: User[]

  setToken: (token: string) => void
  loadUser: () => Promise<void>
  updateTimezone: (timezone: string) => Promise<void>
  logout: () => void
}

const loadPreviousUsers = (): User[] => {
  try {
    const raw = localStorage.getItem('logbook_users')
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('logbook_token'),
  isLoading: true,
  isAuthenticated: false,
  previousUsers: loadPreviousUsers(),

  setToken: (token: string) => {
    localStorage.setItem('logbook_token', token)
    set({ token, isAuthenticated: true })
  },

  loadUser: async () => {
    const token = localStorage.getItem('logbook_token')
    if (!token) { set({ isLoading: false, isAuthenticated: false }); return }

    set({ isLoading: true })
    try {
      const user = await authApi.getMe()

      // ── First-login timezone detection ────────────────────────────────────
      // If the user has no timezone saved yet, detect it from the browser and
      // save it once. We never overwrite it automatically after this point —
      // the user owns it from here on.
      if (!user.timezone) {
        try {
          const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
          if (detected) {
            await authApi.updateTimezone(detected)
            user.timezone = detected
          }
        } catch {
          // Silently ignore — backend falls back to UTC
        }
      }

      // Track previously signed-in users for quick sign-in UI
      const existing = get().previousUsers
      const idx = existing.findIndex(u => u.id === user.id)
      const updated =
        idx === -1
          ? [...existing, user]
          : existing.map(u => (u.id === user.id ? user : u))

      localStorage.setItem('logbook_users', JSON.stringify(updated))

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        previousUsers: updated,
      })
    } catch {
      localStorage.removeItem('logbook_token')
      set({ user: null, token: null, isAuthenticated: false, isLoading: false })
    }
  },

  /**
   * Called from the Settings page when the user manually changes their timezone.
   * Saves to backend and updates the local user object immediately.
   */
  updateTimezone: async (timezone: string) => {
    await authApi.updateTimezone(timezone)
    set(state => ({
      user: state.user ? { ...state.user, timezone } : null,
    }))
    // Keep previousUsers in sync too
    const { user, previousUsers } = get()
    if (user) {
      const updated = previousUsers.map(u => u.id === user.id ? { ...u, timezone } : u)
      localStorage.setItem('logbook_users', JSON.stringify(updated))
      set({ previousUsers: updated })
    }
  },

  logout: () => {
    localStorage.removeItem('logbook_token')
    set({ user: null, token: null, isAuthenticated: false })
    window.location.href = '/login'
  },
}))