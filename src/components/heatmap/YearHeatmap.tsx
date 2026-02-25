import { useMemo } from 'react'
import { format, parseISO, eachDayOfInterval, subDays } from 'date-fns'
import type { HeatmapData } from '../../types'

interface YearHeatmapProps {
  data: HeatmapData | null
  onDayClick?: (date: string) => void
}

const HEAT_COLORS = [
  '#0e0e1a', // 0 - no activity
  '#1a3a2a', // 1 - light
  '#1e5c3a', // 2 - medium
  '#26a95a', // 3 - active
  '#3dd68c', // 4 - very active
]

const WEEKS = 53

export function YearHeatmap({ data, onDayClick }: YearHeatmapProps) {
  const { days, months } = useMemo(() => {
    const today = new Date()
    const start = subDays(today, WEEKS * 7 - 1)
    const allDays = eachDayOfInterval({ start, end: today })

    // Build lookup map
    const countMap: Record<string, { count: number; level: number }> = {}
    data?.data.forEach(d => { countMap[d.date] = { count: d.count, level: d.level } })

    // Group into weeks (columns)
    const weeks: Array<Array<{ date: string; count: number; level: number } | null>> = []
    let week: Array<{ date: string; count: number; level: number } | null> = []

    // Pad the first week
    const startDow = start.getDay()
    for (let i = 0; i < startDow; i++) week.push(null)

    allDays.forEach(day => {
      const key = format(day, 'yyyy-MM-dd')
      week.push({ date: key, count: countMap[key]?.count || 0, level: countMap[key]?.level || 0 })
      if (week.length === 7) { weeks.push(week); week = [] }
    })
    if (week.length > 0) {
      while (week.length < 7) week.push(null)
      weeks.push(week)
    }

    // Month labels
    const monthLabels: Array<{ label: string; col: number }> = []
    let lastMonth = -1
    weeks.forEach((w, wi) => {
      const firstReal = w.find(d => d !== null)
      if (firstReal) {
        const m = parseISO(firstReal.date).getMonth()
        if (m !== lastMonth) {
          monthLabels.push({ label: format(parseISO(firstReal.date), 'MMM'), col: wi })
          lastMonth = m
        }
      }
    })

    return { days: weeks, months: monthLabels }
  }, [data])

  const cellSize = 12
  const gap = 3

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-block min-w-full">
        {/* Month labels */}
        <div className="flex mb-1" style={{ paddingLeft: '28px' }}>
          {months.map(({ label, col }) => (
            <div
              key={`${label}-${col}`}
              className="text-xs text-muted font-mono absolute"
              style={{ left: `${28 + col * (cellSize + gap)}px`, position: 'relative', width: 0, whiteSpace: 'nowrap' }}
            >
              {label}
            </div>
          ))}
        </div>

        <div className="flex gap-0.5">
          {/* Day labels */}
          <div className="flex flex-col gap-0.5 mr-1">
            {['', 'M', '', 'W', '', 'F', ''].map((d, i) => (
              <div
                key={i}
                className="text-xs text-muted font-mono flex items-center justify-end"
                style={{ height: `${cellSize}px`, width: '16px', fontSize: '9px' }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex gap-0.5">
            {days.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((day, di) => (
                  <div
                    key={di}
                    title={day ? `${day.date}: ${day.count} entr${day.count === 1 ? 'y' : 'ies'}` : ''}
                    onClick={() => day && onDayClick?.(day.date)}
                    style={{
                      width: `${cellSize}px`,
                      height: `${cellSize}px`,
                      backgroundColor: day ? HEAT_COLORS[day.level] : 'transparent',
                      borderRadius: '2px',
                      cursor: day ? 'pointer' : 'default',
                      transition: 'transform 0.1s, filter 0.1s',
                    }}
                    className={day && day.level > 0 ? 'hover:brightness-125 hover:scale-110' : ''}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-3 justify-end">
          <span className="text-xs text-muted font-mono">Less</span>
          {HEAT_COLORS.map((color, i) => (
            <div
              key={i}
              style={{ width: '10px', height: '10px', backgroundColor: color, borderRadius: '2px' }}
            />
          ))}
          <span className="text-xs text-muted font-mono">More</span>
        </div>
      </div>
    </div>
  )
}