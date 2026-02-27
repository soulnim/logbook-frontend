import { create } from 'zustand'
import type { Entry, HeatmapData } from '../types'
import { entriesApi } from '../api/entries'
import { statsApi } from '../api/stats'
import { format } from 'date-fns'

interface EntryState {
  // Calendar state
  currentMonth: Date
  selectedDate: Date | null
  isPanelOpen: boolean

  // Data
  entriesByDate: Record<string, Entry[]>   // keyed by "YYYY-MM-DD"
  heatmap: HeatmapData | null
  isLoadingEntries: boolean
  isLoadingHeatmap: boolean

  // Actions
  setCurrentMonth: (month: Date) => void
  selectDate: (date: Date) => void
  closePanel: () => void
  loadMonthEntries: (month: Date) => Promise<void>
  loadHeatmap: () => Promise<void>
  addEntry: (entry: Entry) => void
  updateEntry: (entry: Entry) => void
  removeEntry: (id: number, date: string) => void
}

export const useEntryStore = create<EntryState>((set, get) => ({
  currentMonth: new Date(),
  selectedDate: null,
  isPanelOpen: false,
  entriesByDate: {},
  heatmap: null,
  isLoadingEntries: false,
  isLoadingHeatmap: false,

  setCurrentMonth: (month) => {
    set({ currentMonth: month })
    get().loadMonthEntries(month)
  },

  selectDate: (date) => {
    set({ selectedDate: date, isPanelOpen: true })
    const key = format(date, 'yyyy-MM-dd')
    // Load if not cached
    if (!get().entriesByDate[key]) {
      entriesApi.getByDate(key).then(entries => {
        set(state => ({
          entriesByDate: { ...state.entriesByDate, [key]: entries }
        }))
      })
    }
  },

  closePanel: () => set({ isPanelOpen: false, selectedDate: null }),

  loadMonthEntries: async (month) => {
    set({ isLoadingEntries: true })
    try {
      const start = format(new Date(month.getFullYear(), month.getMonth(), 1), 'yyyy-MM-dd')
      const end   = format(new Date(month.getFullYear(), month.getMonth() + 1, 0), 'yyyy-MM-dd')
      const entries = await entriesApi.getByRange(start, end)

      // Group by date
      const grouped: Record<string, Entry[]> = {}
      entries.forEach(e => {
        if (!grouped[e.entryDate]) grouped[e.entryDate] = []
        grouped[e.entryDate].push(e)
      })

      set(state => ({
        entriesByDate: { ...state.entriesByDate, ...grouped },
        isLoadingEntries: false,
      }))
    } catch {
      set({ isLoadingEntries: false })
    }
  },

  loadHeatmap: async () => {
    set({ isLoadingHeatmap: true })
    try {
      // Use local date formatting to avoid timezone boundary issues where
      // new Date() in one timezone might be a different calendar date on the server.
      const today = new Date()
      const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      const past = new Date(today)
      past.setDate(past.getDate() - 364)
      const localStart = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, '0')}-${String(past.getDate()).padStart(2, '0')}`
      const heatmap = await statsApi.getHeatmap(localStart, localToday)
      set({ heatmap, isLoadingHeatmap: false })
    } catch {
      set({ isLoadingHeatmap: false })
    }
  },

  addEntry: (entry) => {
    set(state => {
      const key = entry.entryDate
      const existing = state.entriesByDate[key] || []
      return {
        entriesByDate: { ...state.entriesByDate, [key]: [...existing, entry] }
      }
    })
    // Refresh heatmap
    get().loadHeatmap()
  },

  updateEntry: (entry) => {
    set(state => {
      const key = entry.entryDate
      const existing = state.entriesByDate[key] || []
      return {
        entriesByDate: {
          ...state.entriesByDate,
          [key]: existing.map(e => e.id === entry.id ? entry : e),
        }
      }
    })
  },

  removeEntry: (id, date) => {
    set(state => {
      const existing = state.entriesByDate[date] || []
      return {
        entriesByDate: {
          ...state.entriesByDate,
          [date]: existing.filter(e => e.id !== id),
        }
      }
    })
    get().loadHeatmap()
  },
}))