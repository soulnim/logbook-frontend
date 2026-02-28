import { isToday, isSameMonth } from 'date-fns'
import { toDateKey, formatDay } from '../../utils/dateUtils'
import type { Entry } from '../../types'
import { ENTRY_TYPE_META } from '../../types'

interface DayCellProps {
  date: Date
  currentMonth: Date
  entries: Entry[]
  isSelected: boolean
  hasMilestone: boolean   // kept for backward compatibility — superseded by GOAL entries
  onClick: () => void
}

const TYPE_ORDER = ['NOTE', 'SKILL', 'ACTION', 'EVENT', 'COMMIT', 'GOAL'] as const

export function DayCell({ date, currentMonth, entries, isSelected, hasMilestone, onClick }: DayCellProps) {
  const isCurrentMonth = isSameMonth(date, currentMonth)
  const isTodayDate    = isToday(date)
  const key            = toDateKey(date)
  const hasEntries     = entries.length > 0

  // Separate GOAL entries (auto-tracked completions) from regular entries
  const goalEntries    = entries.filter(e => e.entryType === 'GOAL' && e.isCompleted)
  const hasGoalCompletion = goalEntries.length > 0

  // Regular entry dots (exclude GOAL entries from the colored dot row — they get their own indicator)
  const typeCounts = TYPE_ORDER.filter(t => t !== 'GOAL' && entries.some(e => e.entryType === t))

  // First non-GOAL entry for hover preview
  const firstRegularEntry = entries.find(e => e.entryType !== 'GOAL')

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
      {/* Day number row */}
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

        <div className="flex items-center gap-1">
          {/* 🎯 Goal completion indicator — replaces the old generic ⭐ */}
          {hasGoalCompletion && (
            <div className="flex items-center gap-0.5">
              <span
                className="text-[10px] leading-none"
                title={`${goalEntries.length} goal milestone${goalEntries.length > 1 ? 's' : ''} completed`}
              >
                🎯
              </span>
              {goalEntries.length > 1 && (
                <span className="text-[8px] font-mono text-emerald-400 leading-none">
                  {goalEntries.length}
                </span>
              )}
            </div>
          )}

          {/* Fallback: legacy hasMilestone flag (no GOAL entries yet) */}
          {!hasGoalCompletion && hasMilestone && (
            <span className="text-[10px] leading-none" title="Milestone completed">
              ⭐
            </span>
          )}

          {hasEntries && (
            <span className="text-xs font-mono text-muted opacity-0 group-hover:opacity-100 transition-opacity">
              {entries.length}
            </span>
          )}
        </div>
      </div>

      {/* Entry type dots (regular entry types only) */}
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
          {/* GOAL dot shown at the end if present */}
          {hasGoalCompletion && (
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: ENTRY_TYPE_META.GOAL.color }}
              title={`${goalEntries.length} goal completion${goalEntries.length > 1 ? 's' : ''}`}
            />
          )}
        </div>
      )}

      {/* Goal entries preview on hover — shown with priority */}
      {goalEntries.length > 0 && (
        <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-[10px] text-emerald-400 truncate leading-tight font-mono">
            {goalEntries[0].title}
          </p>
          {goalEntries.length > 1 && (
            <p className="text-[9px] text-muted font-mono">
              +{goalEntries.length - 1} more
            </p>
          )}
        </div>
      )}

      {/* Regular entry preview on hover — only shown when no goal entries */}
      {goalEntries.length === 0 && firstRegularEntry && (
        <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-xs text-secondary truncate leading-tight">
            {firstRegularEntry.title}
          </p>
        </div>
      )}
    </button>
  )
}