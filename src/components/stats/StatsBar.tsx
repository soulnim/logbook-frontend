import { Flame, Calendar, BookOpen, TrendingUp } from 'lucide-react'
import type { HeatmapData } from '../../types'

interface StatsBarProps {
  data: HeatmapData | null
}

export function StatsBar({ data }: StatsBarProps) {
  const stats = [
    {
      icon: <BookOpen size={14} />,
      label: 'Total entries',
      value: data?.totalEntries ?? '—',
    },
    {
      icon: <Calendar size={14} />,
      label: 'Active days',
      value: data?.activeDays ?? '—',
    },
    {
      icon: <Flame size={14} className="text-action" />,
      label: 'Current streak',
      value: data?.currentStreak ? `${data.currentStreak}d` : '—',
      highlight: (data?.currentStreak ?? 0) > 0,
    },
    {
      icon: <TrendingUp size={14} className="text-skill" />,
      label: 'Longest streak',
      value: data?.longestStreak ? `${data.longestStreak}d` : '—',
    },
  ]

  return (
    <div className="flex gap-6">
      {stats.map(stat => (
        <div key={stat.label} className="flex items-center gap-2">
          <span className="text-secondary">{stat.icon}</span>
          <div>
            <p className={`text-lg font-mono font-semibold leading-none ${stat.highlight ? 'text-action' : 'text-primary'}`}>
              {stat.value}
            </p>
            <p className="text-xs text-muted font-body mt-0.5">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}