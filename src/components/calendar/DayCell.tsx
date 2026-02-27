import { isToday, isSameMonth } from 'date-fns'
import { toDateKey, formatDay } from '../../utils/dateUtils'
import type { Entry } from '../../types'
import { ENTRY_TYPE_META } from '../../types'

interface DayCellProps {
  date: Date
  currentMonth: Date
  entries: Entry[]
  isSelected: boolean
  onClick: () => void
}

const TYPE_ORDER = ['NOTE', 'SKILL', 'ACTION', 'EVENT', 'COMMIT'] as const

export function DayCell({ date, currentMonth, entries, isSelected, onClick }: DayCellProps) {
  const isCurrentMonth = isSameMonth(date, currentMonth)
  const isTodayDate    = isToday(date)
  const key            = toDateKey(date)
  const hasEntries     = entries.length > 0

  // Count by type for the dots
  const typeCounts = TYPE_ORDER.filter(t => entries.some(e => e.entryType === t))

  return (
    <button
      onClick={onClick}
      data-date={key}
      className={`
        relative flex flex-col p-2 rounded-lg border transition-all duration-150 text-left
        min-h-[80px] group
        ${isCurrentMonth ? '' : 'opacity-30'}
        ${isSelected
          ? 'border-accent/60 bg-accent/10 ring-1 ring-accent/30'
          : 'border-border hover:border-accent/30 hover:bg-hover'
        }
        ${isCurrentMonth ? 'cursor-pointer' : 'cursor-default'}
      `}
    >
      {/* Day number */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={`
            text-sm font-mono font-medium leading-none w-7 h-7 flex items-center justify-center rounded-full
            ${isTodayDate
              ? 'bg-accent text-bg font-bold'
              : isSelected
                ? 'text-accent'
                : isCurrentMonth
                  ? 'text-primary'
                  : 'text-muted'
            }
          `}
        >
          {formatDay(date)}
        </span>

        {hasEntries && (
          <span className="text-xs font-mono text-muted opacity-0 group-hover:opacity-100 transition-opacity">
            {entries.length}
          </span>
        )}
      </div>

      {/* Entry type dots */}
      {typeCounts.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-auto">
          {typeCounts.slice(0, 4).map(type => (
            <div
              key={type}
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: ENTRY_TYPE_META[type].color }}
              title={ENTRY_TYPE_META[type].label}
            />
          ))}
        </div>
      )}

      {/* Preview of first entry title on hover */}
      {entries[0] && (
        <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-xs text-secondary truncate leading-tight">
            {entries[0].title}
          </p>
        </div>
      )}
    </button>
  )
}