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
  // Start in a loading state so refresh waits for loadUser()
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

  logout: () => {
    localStorage.removeItem('logbook_token')
    set({ user: null, token: null, isAuthenticated: false })
    window.location.href = '/login'
  },
}))