import { create } from 'zustand'

type Theme = 'dark' | 'light'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggle: () => void
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
    root.classList.remove('light')
  } else {
    root.classList.add('light')
    root.classList.remove('dark')
  }
  localStorage.setItem('logbook_theme', theme)
}

// Read saved preference, default to dark
const saved = localStorage.getItem('logbook_theme') as Theme | null
const initial: Theme = saved ?? 'dark'
applyTheme(initial)

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: initial,

  setTheme: (theme) => {
    applyTheme(theme)
    set({ theme })
  },

  toggle: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    set({ theme: next })
  },
}))