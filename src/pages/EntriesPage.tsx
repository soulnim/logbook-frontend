import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, parseISO, subDays, startOfMonth, endOfMonth, startOfYear } from 'date-fns'
import { LogOut, BookOpen, CalendarDays, List, Filter, ChevronDown, X, Search, Settings } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useEntryStore } from '../store/entryStore'
import { entriesApi } from '../api/entries'
import { EntryCard } from '../components/entry/EntryCard'
import { EntryPanel } from '../components/entry/EntryPanel'
import type { Entry, EntryType } from '../types'
import { ENTRY_TYPE_META } from '../types'

// ── Date preset options ───────────────────────────────────────────────────────

type DatePreset = '7d' | '30d' | '90d' | 'thisMonth' | 'thisYear' | 'custom'

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: '7d',       label: 'Last 7 days' },
  { value: '30d',      label: 'Last 30 days' },
  { value: '90d',      label: 'Last 90 days' },
  { value: 'thisMonth',label: 'This month' },
  { value: 'thisYear', label: 'This year' },
  { value: 'custom',   label: 'Custom range' },
]

function getPresetDates(preset: DatePreset): { start: string; end: string } {
  const today = new Date()
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd')
  switch (preset) {
    case '7d':        return { start: fmt(subDays(today, 6)),         end: fmt(today) }
    case '30d':       return { start: fmt(subDays(today, 29)),        end: fmt(today) }
    case '90d':       return { start: fmt(subDays(today, 89)),        end: fmt(today) }
    case 'thisMonth': return { start: fmt(startOfMonth(today)),       end: fmt(endOfMonth(today)) }
    case 'thisYear':  return { start: fmt(startOfYear(today)),        end: fmt(today) }
    default:          return { start: fmt(subDays(today, 29)),        end: fmt(today) }
  }
}

// ── Group entries by date ─────────────────────────────────────────────────────

type GroupedEntries = { date: string; entries: Entry[] }[]

function groupByDate(entries: Entry[]): GroupedEntries {
  const map: Record<string, Entry[]> = {}
  entries.forEach(e => {
    if (!map[e.entryDate]) map[e.entryDate] = []
    map[e.entryDate].push(e)
  })
  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))  // newest first
    .map(([date, entries]) => ({ date, entries }))
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function EntriesPage() {
  const navigate                             = useNavigate()
  const { user, logout }                     = useAuthStore()
  const { selectDate }                       = useEntryStore()

  // Filter state
  const [activeType, setActiveType]         = useState<EntryType | null>(null)
  const [preset, setPreset]                 = useState<DatePreset>('30d')
  const [customStart, setCustomStart]       = useState('')
  const [customEnd, setCustomEnd]           = useState('')
  const [showCustom, setShowCustom]         = useState(false)
  const [searchQuery, setSearchQuery]       = useState('')
  const [topSearchQuery, setTopSearchQuery]  = useState('')
  const [showTopSearch, setShowTopSearch]    = useState(false)

  // Data state
  const [entries, setEntries]               = useState<Entry[]>([])
  const [isLoading, setIsLoading]           = useState(false)
  const [error, setError]                   = useState('')

  // Derived date range
  const dateRange = useMemo(() => {
    if (preset === 'custom' && customStart && customEnd) {
      return { start: customStart, end: customEnd }
    }
    return getPresetDates(preset === 'custom' ? '30d' : preset)
  }, [preset, customStart, customEnd])

  // Fetch entries whenever filters change
  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setError('')
      try {
        const data = await entriesApi.getByRange(
          dateRange.start,
          dateRange.end,
          activeType ?? undefined,
        )
        setEntries(data)
      } catch {
        setError('Failed to load entries. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [dateRange, activeType])

  // Client-side search filter on top of fetched entries
  // Merge topbar search + filter bar search — either one narrows results
  const effectiveSearch = topSearchQuery.trim() || searchQuery.trim()
  const filteredEntries = useMemo(() => {
    if (!effectiveSearch) return entries
    const q = effectiveSearch.toLowerCase()
    return entries.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.content?.toLowerCase().includes(q) ||
      e.tags.some(t => t.name.toLowerCase().includes(q))
    )
  }, [entries, effectiveSearch])

  const grouped = useMemo(() => groupByDate(filteredEntries), [filteredEntries])

  const handleEntryEdit = (entry: Entry) => {
    selectDate(parseISO(entry.entryDate))
  }

  const handlePresetChange = (p: DatePreset) => {
    setPreset(p)
    setShowCustom(p === 'custom')
  }

  const totalCount = filteredEntries.length

  return (
    <div className="min-h-screen bg-bg text-primary flex flex-col font-body">
      {/* Grid background */}
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
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono text-secondary hover:text-primary hover:bg-hover transition-colors"
            >
              <CalendarDays size={13} />
              Calendar
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono bg-accent/15 text-accent transition-colors"
            >
              <List size={13} />
              Entries
            </button>
          </nav>

          {/* Search */}
          <div className={`flex-1 max-w-sm transition-all duration-200 ${showTopSearch ? 'opacity-100' : 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto'}`}>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={topSearchQuery}
                onChange={e => setTopSearchQuery(e.target.value)}
                placeholder="Search entries..."
                className="w-full bg-surface border border-border rounded-md pl-8 pr-8 py-1.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-accent/40 transition-colors font-body"
              />
              {topSearchQuery && (
                <button onClick={() => setTopSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-secondary">
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-md text-secondary hover:text-primary hover:bg-hover"
              onClick={() => setShowTopSearch(s => !s)}
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
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-0 flex-1 max-w-7xl mx-auto w-full px-6 py-6 flex flex-col gap-5">

        {/* Page title */}
        <div>
          <h1 className="text-2xl font-display font-semibold text-primary tracking-tight">
            All Entries
          </h1>
          <p className="text-sm text-secondary font-body mt-1">
            Browse and filter your complete logbook
          </p>
        </div>

        {/* Filter bar */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-4">

          {/* Type filter */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono text-muted uppercase tracking-widest">
              Type
            </label>
            <div className="flex flex-wrap gap-2">
              {/* All pill */}
              <button
                onClick={() => setActiveType(null)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono border transition-all duration-150 ${
                  activeType === null
                    ? 'bg-accent text-bg border-transparent font-medium'
                    : 'border-border text-secondary hover:border-accent/30 hover:text-primary'
                }`}
              >
                All
              </button>

              {/* Type pills */}
              {(Object.entries(ENTRY_TYPE_META) as [EntryType, typeof ENTRY_TYPE_META[EntryType]][]).map(([type, meta]) => (
                <button
                  key={type}
                  onClick={() => setActiveType(activeType === type ? null : type)}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono border transition-all duration-150 ${
                    activeType === type
                      ? 'border-transparent font-medium text-bg'
                      : 'border-border text-secondary hover:border-accent/30 hover:text-primary'
                  }`}
                  style={activeType === type ? { backgroundColor: meta.color } : {}}
                >
                  {meta.icon} {meta.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date + Search row */}
          <div className="flex flex-wrap gap-3 items-end">
            {/* Date preset */}
            <div className="flex flex-col gap-2 min-w-[160px]">
              <label className="text-xs font-mono text-muted uppercase tracking-widest">
                Date range
              </label>
              <div className="relative">
                <select
                  value={preset}
                  onChange={e => handlePresetChange(e.target.value as DatePreset)}
                  className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-primary font-body appearance-none pr-8 focus:outline-none focus:border-accent/50 transition-colors cursor-pointer"
                >
                  {DATE_PRESETS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              </div>
            </div>

            {/* Custom date inputs */}
            {showCustom && (
              <div className="flex items-end gap-2">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase tracking-widest">From</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={e => setCustomStart(e.target.value)}
                    className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-primary font-body focus:outline-none focus:border-accent/50 transition-colors"
                  />
                </div>
                <span className="text-muted text-sm pb-2">→</span>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-muted uppercase tracking-widest">To</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={e => setCustomEnd(e.target.value)}
                    className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-primary font-body focus:outline-none focus:border-accent/50 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Search */}
            <div className="flex flex-col gap-2 flex-1 min-w-[180px]">
              <label className="text-xs font-mono text-muted uppercase tracking-widest">Search</label>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Title, content, tags..."
                  className="w-full bg-surface border border-border rounded-md pl-8 pr-8 py-2 text-sm text-primary font-body placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-secondary">
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Active filter summary */}
          <div className="flex items-center gap-2 pt-1 border-t border-border/50">
            <Filter size={11} className="text-muted" />
            <span className="text-xs text-muted font-mono">
              {isLoading ? 'Loading...' : (
                <>
                  <span className="text-primary font-medium">{totalCount}</span>
                  {' '}entr{totalCount === 1 ? 'y' : 'ies'}
                  {activeType && <span> · {ENTRY_TYPE_META[activeType].label} only</span>}
                  {searchQuery && <span> · matching "{searchQuery}"</span>}
                  <span className="ml-1">
                    · {format(parseISO(dateRange.start), 'MMM d')} – {format(parseISO(dateRange.end), 'MMM d, yyyy')}
                  </span>
                </>
              )}
            </span>

            {/* Clear all filters */}
            {(activeType || searchQuery || preset !== '30d') && (
              <button
                onClick={() => {
                  setActiveType(null)
                  setSearchQuery('')
                  setPreset('30d')
                  setShowCustom(false)
                }}
                className="ml-auto text-xs text-muted hover:text-secondary font-mono transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {error && (
          <div className="text-center py-8 text-red-400 text-sm">{error}</div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          </div>
        )}

        {!isLoading && !error && grouped.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-card border border-border flex items-center justify-center mb-4">
              <List size={22} className="text-muted" />
            </div>
            <p className="text-secondary font-body">No entries found</p>
            <p className="text-xs text-muted font-body mt-1">
              Try adjusting your filters or date range
            </p>
          </div>
        )}

        {!isLoading && grouped.map(({ date, entries: dayEntries }) => (
          <div key={date} className="flex flex-col gap-3 animate-fade-in">
            {/* Date header */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-display font-semibold text-primary">
                  {format(parseISO(date), 'EEEE, MMMM d')}
                </span>
                <span className="text-xs font-mono text-muted">
                  {format(parseISO(date), 'yyyy')}
                </span>
              </div>
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs font-mono text-muted shrink-0">
                {dayEntries.length} entr{dayEntries.length === 1 ? 'y' : 'ies'}
              </span>
            </div>

            {/* Entry cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {dayEntries.map(entry => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onEdit={() => handleEntryEdit(entry)}
                />
              ))}
            </div>
          </div>
        ))}
      </main>

      {/* Reuse the same side panel */}
      <EntryPanel />
    </div>
  )
}