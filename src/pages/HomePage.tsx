import { useEffect, useState } from 'react'
import { parseISO, format } from 'date-fns'
import { X } from 'lucide-react'
import { useEntryStore } from '../store/entryStore'
import { MonthCalendar } from '../components/calendar/MonthCalendar'
import { EntryPanel } from '../components/entry/EntryPanel'
import { YearHeatmap } from '../components/heatmap/YearHeatmap'
import { StatsBar } from '../components/stats/StatsBar'
import { Navbar } from '../components/layout/Navbar'
import { entriesApi } from '../api/entries'
import type { Entry } from '../types'
import { EntryCard } from '../components/entry/EntryCard'

export function HomePage() {
  const { currentMonth, loadMonthEntries, loadHeatmap, heatmap, selectDate } = useEntryStore()
  const [searchQuery,   setSearchQuery]   = useState('')
  const [searchResults, setSearchResults] = useState<Entry[] | null>(null)
  const [isSearching,   setIsSearching]   = useState(false)

  useEffect(() => {
    loadMonthEntries(currentMonth)
    loadHeatmap()
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults(null); return }
    const t = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await entriesApi.search(searchQuery)
        setSearchResults(results)
      } finally { setIsSearching(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  const clearSearch = () => { setSearchQuery(''); setSearchResults(null) }

  return (
    <div className="min-h-screen bg-bg text-primary flex flex-col font-body">
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(#818cf8 1px, transparent 1px), linear-gradient(90deg, #818cf8 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main className="relative z-0 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col gap-6">

        {searchResults !== null && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-secondary font-body">
                {isSearching ? 'Searching...' : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} for "${searchQuery}"`}
              </p>
              <button onClick={clearSearch} className="text-xs text-muted hover:text-secondary font-mono flex items-center gap-1">
                <X size={11} /> Clear
              </button>
            </div>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {searchResults.map(entry => (
                  <div key={entry.id}>
                    <p className="text-xs text-muted font-mono mb-1.5">{format(parseISO(entry.entryDate), 'MMM d, yyyy')}</p>
                    <EntryCard entry={entry} onEdit={() => { clearSearch(); selectDate(parseISO(entry.entryDate)) }} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-secondary text-sm">No entries found</div>
            )}
          </div>
        )}

        {searchResults === null && (
          <>
            <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
              <div className="mb-5">
                <h2 className="text-xs font-mono text-muted uppercase tracking-widest mb-1">Commit history</h2>
                <StatsBar data={heatmap} />
              </div>
              <div className="overflow-x-auto">
                <YearHeatmap data={heatmap} onDayClick={(date) => selectDate(parseISO(date))} />
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 sm:p-5 flex-1 flex flex-col min-h-[500px]">
              <MonthCalendar />
            </div>
          </>
        )}
      </main>

      <EntryPanel />
    </div>
  )
}