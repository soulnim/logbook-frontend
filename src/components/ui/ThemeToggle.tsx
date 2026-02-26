import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'

export function ThemeToggle() {
  const { theme, toggle } = useThemeStore()

  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="w-7 h-7 flex items-center justify-center rounded-md text-muted hover:text-secondary hover:bg-hover transition-colors"
    >
      {theme === 'dark'
        ? <Sun size={14} />
        : <Moon size={14} />
      }
    </button>
  )
}