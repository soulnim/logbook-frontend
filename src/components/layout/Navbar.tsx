import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  BookOpen, Search, Settings, LogOut, X,
  CalendarDays, List, BarChart2, Menu, Sun, Moon, Target,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore } from '../../store/themeStore'

interface NavbarProps {
  searchQuery?: string
  onSearchChange?: (q: string) => void
  showSearch?: boolean
}

const NAV_ITEMS = [
  { path: '/',        label: 'Calendar', icon: CalendarDays },
  { path: '/entries', label: 'Entries',  icon: List         },
  { path: '/stats',   label: 'Stats',    icon: BarChart2    },
  { path: '/goals',   label: 'Goals',    icon: Target       },
]

export function Navbar({ searchQuery = '', onSearchChange, showSearch = true }: NavbarProps) {
  const navigate           = useNavigate()
  const { pathname }       = useLocation()
  const { user, logout }   = useAuthStore()
  const { theme, toggle }  = useThemeStore()

  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [searchFocus, setSearchFocus] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close mobile menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  const activeTab = NAV_ITEMS.find(n => n.path === pathname)?.path ?? '/'

  return (
    <header className="relative z-40 border-b border-border bg-bg/80 backdrop-blur-sm sticky top-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">

        {/* ── Logo ── */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-md bg-card border border-border flex items-center justify-center">
            <BookOpen size={13} className="text-accent" />
          </div>
          <span className="text-base font-display font-bold text-primary tracking-tight">
            Logbook
          </span>
        </div>

        {/* ── Desktop nav tabs (hidden on mobile) ── */}
        <nav className="hidden md:flex items-center gap-1 bg-card border border-border rounded-lg p-1 shrink-0">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${
                activeTab === path
                  ? 'bg-accent/15 text-accent'
                  : 'text-secondary hover:text-primary hover:bg-hover'
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </nav>

        {/* ── Desktop search (hidden on mobile) ── */}
        {showSearch && onSearchChange && (
          <div className="hidden md:block flex-1 max-w-sm">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                placeholder="Search entries..."
                className="w-full bg-surface border border-border rounded-md pl-8 pr-8 py-1.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-accent/40 transition-colors font-body"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-secondary"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Desktop right actions (hidden on mobile) ── */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {user && (
            <>
              {user.avatarUrl && (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-7 h-7 rounded-full border border-border"
                />
              )}
              <span className="text-sm text-secondary font-body hidden sm:block">
                {user.name.split(' ')[0]}
              </span>
              <button
                onClick={toggle}
                className="w-7 h-7 flex items-center justify-center rounded-md text-muted hover:text-secondary hover:bg-hover transition-colors"
                title="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="w-7 h-7 flex items-center justify-center rounded-md text-muted hover:text-secondary hover:bg-hover transition-colors"
                title="Settings"
              >
                <Settings size={14} />
              </button>
              <button
                onClick={logout}
                className="w-7 h-7 flex items-center justify-center rounded-md text-muted hover:text-secondary hover:bg-hover transition-colors"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            </>
          )}
        </div>

        {/* ── Mobile right: hamburger ── */}
        <div className="flex md:hidden items-center gap-2" ref={menuRef}>
          {/* Mobile search icon if search enabled */}
          {showSearch && onSearchChange && (
            <button
              onClick={() => setSearchFocus(v => !v)}
              className="w-8 h-8 flex items-center justify-center rounded-md text-secondary hover:text-primary hover:bg-hover"
            >
              <Search size={16} />
            </button>
          )}

          <button
            onClick={() => setMobileOpen(v => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-md text-secondary hover:text-primary hover:bg-hover transition-colors"
            aria-label="Menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* ── Mobile dropdown menu ── */}
          {mobileOpen && (
            <div className="absolute top-full right-0 left-0 mt-px bg-bg border-b border-border shadow-xl animate-fade-in z-50">
              <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">

                {/* Search bar in dropdown */}
                {showSearch && onSearchChange && (
                  <div className="relative mb-2">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      value={searchQuery}
                      onChange={e => onSearchChange(e.target.value)}
                      placeholder="Search entries..."
                      autoFocus={searchFocus}
                      className="w-full bg-surface border border-border rounded-md pl-8 pr-8 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-accent/40 transition-colors font-body"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => onSearchChange('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-secondary"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                )}

                {/* Nav items */}
                {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
                  <button
                    key={path}
                    onClick={() => navigate(path)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-mono transition-colors ${
                      activeTab === path
                        ? 'bg-accent/15 text-accent'
                        : 'text-secondary hover:text-primary hover:bg-hover'
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}

                {/* Divider */}
                <div className="h-px bg-border my-1" />

                {/* User info */}
                {user && (
                  <div className="flex items-center gap-3 px-3 py-2">
                    {user.avatarUrl && (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-8 h-8 rounded-full border border-border"
                      />
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm text-primary font-medium">{user.name}</span>
                      <span className="text-xs text-muted">{user.email}</span>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <button
                  onClick={toggle}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-mono text-secondary hover:text-primary hover:bg-hover transition-colors"
                >
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                  {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                </button>

                <button
                  onClick={() => navigate('/settings')}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-mono text-secondary hover:text-primary hover:bg-hover transition-colors"
                >
                  <Settings size={16} />
                  Settings
                </button>

                <button
                  onClick={logout}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-mono text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}