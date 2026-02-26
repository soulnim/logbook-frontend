import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { LogOut, Search, BookOpen, X, CalendarDays, List } from 'lucide-react'
import { useEntryStore } from '../store/entryStore'
import { useAuthStore } from '../store/authStore'
import { MonthCalendar } from '../components/calendar/MonthCalendar'
import { EntryPanel } from '../components/entry/EntryPanel'
import { YearHeatmap } from '../components/heatmap/YearHeatmap'
import { StatsBar } from '../components/stats/StatsBar'
import { entriesApi } from '../api/entries'
import type { Entry } from '../types'
import { EntryCard } from '../components/entry/EntryCard'
import { format, parseISO } from 'date-fns'

export function HomePage() {
  const navigate = useNavigate()
  const { user, logout }                       = useAuthStore()
  const { currentMonth, loadMonthEntries, loadHeatmap, heatmap, selectDate } = useEntryStore()
  const [searchQuery, setSearchQuery]          = useState('')
  const [searchResults, setSearchResults]      = useState<Entry[] | null>(null)
  const [isSearching, setIsSearching]          = useState(false)
  const [showSearch, setShowSearch]            = useState(false)

  useEffect(() => {
    loadMonthEntries(currentMonth)
    loadHeatmap()
  }, [])

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults(null); return }
    const t = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await entriesApi.search(searchQuery)
        setSearchResults(results)
      } finally {
        setIsSearching(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  const handleHeatmapDayClick = (date: string) => {
    selectDate(parseISO(date))
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults(null)
    setShowSearch(false)
  }

  return (
    <div className="min-h-screen bg-bg text-primary flex flex-col font-body">
      {/* Subtle grid texture */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(#818cf8 1px, transparent 1px),
            linear-gradient(90deg, #818cf8 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Topbar */}
      <header className="relative z-10 border-b border-border bg-bg/80 backdrop-blur-sm sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-md bg-card border border-border flex items-center justify-center">
              <BookOpen size={13} className="text-accent" />
            </div>
            <span className="text-base font-display font-bold text-primary tracking-tight">
              Logbook
            </span>
          </div>

          {/* Nav tabs */}
          <nav className="flex items-center gap-1 bg-card border border-border rounded-lg p-1 shrink-0">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono bg-accent/15 text-accent transition-colors"
            >
              <CalendarDays size={13} />
              Calendar
            </button>
            <button
              onClick={() => navigate('/entries')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono text-secondary hover:text-primary hover:bg-hover transition-colors"
            >
              <List size={13} />
              Entries
            </button>
          </nav>

          {/* Search */}
          <div className={`flex-1 max-w-sm transition-all duration-200 ${showSearch ? 'opacity-100' : 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto'}`}>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search entries..."
                className="w-full bg-surface border border-border rounded-md pl-8 pr-8 py-1.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-accent/40 transition-colors font-body"
              />
              {searchQuery && (
                <button onClick={clearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-secondary">
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-md text-secondary hover:text-primary hover:bg-hover"
              onClick={() => setShowSearch(s => !s)}
            >
              <Search size={16} />
            </button>

            {user && (
              <div className="flex items-center gap-2">
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
                <ThemeToggle />
                <button
                  onClick={logout}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-muted hover:text-secondary hover:bg-hover transition-colors"
                  title="Sign out"
                >
                  <LogOut size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-0 flex-1 max-w-7xl mx-auto w-full px-6 py-6 flex flex-col gap-6">

        {/* Search results overlay */}
        {searchResults !== null && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-secondary font-body">
                {isSearching ? 'Searching...' : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} for "${searchQuery}"`}
              </p>
              <button onClick={clearSearch} className="text-xs text-muted hover:text-secondary font-mono">
                Clear search
              </button>
            </div>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {searchResults.map(entry => (
                  <div key={entry.id}>
                    <p className="text-xs text-muted font-mono mb-1.5">
                      {format(parseISO(entry.entryDate), 'MMM d, yyyy')}
                    </p>
                    <EntryCard
                      entry={entry}
                      onEdit={() => {
                        clearSearch()
                        selectDate(parseISO(entry.entryDate))
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-secondary text-sm">No entries found</div>
            )}
          </div>
        )}

        {/* Normal view */}
        {searchResults === null && (
          <>
            {/* Heatmap + Stats */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-xs font-mono text-muted uppercase tracking-widest mb-1">
                    Commit history
                  </h2>
                  <StatsBar data={heatmap} />
                </div>
              </div>
              <YearHeatmap data={heatmap} onDayClick={handleHeatmapDayClick} />
            </div>

            {/* Calendar */}
            <div className="bg-card border border-border rounded-xl p-5 flex-1 flex flex-col min-h-[500px]">
              <MonthCalendar />
            </div>
          </>
        )}
      </main>

      {/* Side panel */}
      <EntryPanel />
    </div>
  )
}