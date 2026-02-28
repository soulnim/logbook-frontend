import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEntryStore } from '../../store/entryStore'
import { DayCell } from './DayCell'
import { getCalendarDays, formatMonthYear, toDateKey, DAY_NAMES, subMonths, addMonths } from '../../utils/dateUtils'
import { goalsApi } from '../../api/goals'

export function MonthCalendar() {
  const {
    currentMonth, selectedDate, entriesByDate,
    setCurrentMonth, selectDate,
  } = useEntryStore()

  // Set of "YYYY-MM-DD" dates where a milestone was completed
  const [milestoneDates, setMilestoneDates] = useState<Set<string>>(new Set())

  const calendarDays = getCalendarDays(currentMonth)

  const goToPrev  = () => setCurrentMonth(subMonths(currentMonth, 1))
  const goToNext  = () => setCurrentMonth(addMonths(currentMonth, 1))
  const goToToday = () => setCurrentMonth(new Date())

  // Fetch all active + completed goals and collect milestone completion dates
  // Re-runs whenever the visible month changes
  useEffect(() => {
    const load = async () => {
      try {
        const goals = await goalsApi.getAll()
        const dates = new Set<string>()

        goals.forEach(goal => {
          goal.milestones.forEach(m => {
            if (m.isCompleted && m.completedAt) {
              // completedAt is an ISO string — take just the date part
              const dateStr = m.completedAt.substring(0, 10)
              dates.add(dateStr)
            }
          })
        })

        setMilestoneDates(dates)
      } catch {
        // Silently ignore — milestone stars are non-critical
      }
    }
    load()
  }, [currentMonth])

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Calendar header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-display font-semibold text-primary tracking-tight">
            {formatMonthYear(currentMonth)}
          </h2>
          <button
            onClick={goToToday}
            className="text-xs font-mono text-secondary border border-border rounded px-2 py-1 hover:border-accent/40 hover:text-accent transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={goToPrev}
            className="w-8 h-8 flex items-center justify-center rounded-md text-secondary hover:text-primary hover:bg-hover transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={goToNext}
            className="w-8 h-8 flex items-center justify-center rounded-md text-secondary hover:text-primary hover:bg-hover transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Day name headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_NAMES.map(name => (
          <div key={name} className="text-center text-xs font-mono text-muted py-1 uppercase tracking-widest">
            {name}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1 flex-1">
        {calendarDays.map(date => {
          const key = toDateKey(date)
          return (
            <DayCell
              key={key}
              date={date}
              currentMonth={currentMonth}
              entries={entriesByDate[key] || []}
              isSelected={selectedDate ? toDateKey(selectedDate) === key : false}
              hasMilestone={milestoneDates.has(key)}
              onClick={() => selectDate(date)}
            />
          )
        })}
      </div>
    </div>
  )
}