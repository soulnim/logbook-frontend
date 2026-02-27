import { useState, useEffect, useMemo } from 'react'
import { format, parseISO, subDays, getDay, startOfWeek, addDays } from 'date-fns'
import { BarChart2, Flame, CalendarDays, TrendingUp, Sparkles, BookOpen, Zap, Brain, GitCommit, Star } from 'lucide-react'
import { statsApi } from '../api/stats'
import { Navbar } from '../components/layout/Navbar'
import { EntryCard } from '../components/entry/EntryCard'
import { useEntryStore } from '../store/entryStore'
import type { StatsData, HeatmapData, EntryType } from '../types'
import { ENTRY_TYPE_META } from '../types'

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<EntryType, React.ElementType> = {
  NOTE:   BookOpen,
  SKILL:  Brain,
  ACTION: Zap,
  EVENT:  CalendarDays,
  COMMIT: GitCommit,
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Build last-8-weeks bar chart data from heatmap entries
function buildWeeklyBars(data: HeatmapData['data']) {
  const today = new Date()
  const weeks: { label: string; count: number }[] = []

  for (let w = 7; w >= 0; w--) {
    const weekEnd   = subDays(today, w * 7)
    const weekStart = subDays(weekEnd, 6)
    const label     = format(weekStart, 'MMM d')

    const count = data.filter(d => {
      const date = parseISO(d.date)
      return date >= weekStart && date <= weekEnd
    }).reduce((sum, d) => sum + d.count, 0)

    weeks.push({ label, count })
  }
  return weeks
}

// Build day-of-week heatmap
function buildDayOfWeekCounts(data: HeatmapData['data']) {
  const counts = [0, 0, 0, 0, 0, 0, 0]
  data.forEach(d => {
    const dow = getDay(parseISO(d.date))
    counts[dow] += d.count
  })
  return counts
}

// SVG Donut chart
function DonutChart({ segments }: { segments: { color: string; value: number; label: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total === 0) return <div className="w-32 h-32 rounded-full bg-surface border border-border" />

  const radius = 40
  const cx = 50
  const cy = 50
  const circumference = 2 * Math.PI * radius

  let offset = 0
  const slices = segments.map(seg => {
    const pct   = seg.value / total
    const dash  = pct * circumference
    const slice = { ...seg, dash, gap: circumference - dash, offset }
    offset += dash
    return slice
  })

  return (
    <svg viewBox="0 0 100 100" className="w-32 h-32 -rotate-90">
      {slices.map((s, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={s.color}
          strokeWidth="16"
          strokeDasharray={`${s.dash} ${s.gap}`}
          strokeDashoffset={-s.offset}
          className="transition-all duration-500"
        />
      ))}
      {/* Inner circle */}
      <circle cx={cx} cy={cy} r="32" className="fill-card" />
    </svg>
  )
}

// Bar chart (weekly activity)
function BarChart({ bars, maxVal }: { bars: { label: string; count: number }[]; maxVal: number }) {
  return (
    <div className="flex items-end gap-1.5 h-28">
      {bars.map((bar, i) => {
        const pct = maxVal > 0 ? (bar.count / maxVal) * 100 : 0
        const isRecent = i === bars.length - 1
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <span className="text-[9px] font-mono text-muted">{bar.count > 0 ? bar.count : ''}</span>
            <div className="w-full rounded-t-sm transition-all duration-500 relative"
              style={{ height: `${Math.max(pct, bar.count > 0 ? 4 : 2)}%`, backgroundColor: isRecent ? 'var(--color-accent)' : 'rgba(129,140,248,0.3)' }}
            />
            <span className="text-[9px] font-mono text-muted truncate w-full text-center hidden sm:block">{bar.label.split(' ')[0]}</span>
          </div>
        )
      })}
    </div>
  )
}

// Stat card
function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}20` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-display font-bold text-primary leading-none">{value}</p>
        <p className="text-xs font-mono text-muted mt-1">{label}</p>
        {sub && <p className="text-[10px] text-muted/60 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function StatsPage() {
  const { selectDate } = useEntryStore()
  const [stats,        setStats]        = useState<StatsData | null>(null)
  const [heatmap,      setHeatmap]      = useState<HeatmapData | null>(null)
  const [isLoading,    setIsLoading]    = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [s, h] = await Promise.all([statsApi.getStats(), statsApi.getHeatmap()])
        setStats(s)
        setHeatmap(h)
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  // ── Derived data ──────────────────────────────────────────────────────────

  const typeSegments = useMemo(() => {
    if (!stats) return []
    return (Object.entries(stats.byType) as [EntryType, number][])
      .filter(([, v]) => v > 0)
      .map(([type, value]) => ({
        color: ENTRY_TYPE_META[type].color,
        value,
        label: ENTRY_TYPE_META[type].label,
        type,
      }))
      .sort((a, b) => b.value - a.value)
  }, [stats])

  const weeklyBars = useMemo(() => heatmap ? buildWeeklyBars(heatmap.data) : [], [heatmap])
  const maxWeekly  = useMemo(() => Math.max(...weeklyBars.map(b => b.count), 1), [weeklyBars])

  const dowCounts  = useMemo(() => heatmap ? buildDayOfWeekCounts(heatmap.data) : [], [heatmap])
  const maxDow     = useMemo(() => Math.max(...dowCounts, 1), [dowCounts])

  const mostActiveDay = useMemo(() => {
    if (!dowCounts.length) return null
    const idx = dowCounts.indexOf(Math.max(...dowCounts))
    return DAY_LABELS[idx]
  }, [dowCounts])

  const bestStreak = stats?.longestStreak ?? 0

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col font-body">
        <Navbar showSearch={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
      </div>
    )
  }

  const totalEntries  = stats?.totalEntries  ?? 0
  const activeDays    = stats?.activeDays    ?? 0
  const currentStreak = stats?.currentStreak ?? 0

  return (
    <div className="min-h-screen bg-bg text-primary flex flex-col font-body">
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(#818cf8 1px, transparent 1px), linear-gradient(90deg, #818cf8 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      <Navbar showSearch={false} />

      <main className="relative z-0 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col gap-6">

        {/* Page header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 size={18} className="text-accent" />
            <h1 className="text-2xl font-display font-semibold text-primary tracking-tight">Your Stats</h1>
          </div>
          <p className="text-sm text-secondary font-body">A look at your progress over time</p>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total entries"   value={totalEntries}                     icon={BookOpen}     color="#818cf8" />
          <StatCard label="Active days"     value={activeDays}                       icon={CalendarDays} color="#34d399" />
          <StatCard label="Current streak"  value={`${currentStreak}d`} sub="days in a row" icon={Flame} color="#f59e0b" />
          <StatCard label="Longest streak"  value={`${bestStreak}d`}    sub="personal best" icon={Star}  color="#f472b6" />
        </div>

        {/* ── Middle row: donut + weekly bars ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Type breakdown */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-xs font-mono text-muted uppercase tracking-widest mb-4">Entries by type</h2>
            {typeSegments.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">No entries yet</p>
            ) : (
              <div className="flex items-center gap-6">
                <DonutChart segments={typeSegments} />
                <div className="flex flex-col gap-2.5 flex-1">
                  {typeSegments.map(seg => {
                    const total = typeSegments.reduce((s, x) => s + x.value, 0)
                    const pct   = total > 0 ? Math.round((seg.value / total) * 100) : 0
                    const Icon  = TYPE_ICONS[seg.type as EntryType]
                    return (
                      <div key={seg.type} className="flex items-center gap-2">
                        <Icon size={12} style={{ color: seg.color }} />
                        <span className="text-xs font-mono text-secondary flex-1">{seg.label}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-surface rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, backgroundColor: seg.color }} />
                          </div>
                          <span className="text-xs font-mono text-primary w-8 text-right">{seg.value}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Weekly activity */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-xs font-mono text-muted uppercase tracking-widest mb-4">Weekly activity <span className="text-muted/50">(last 8 weeks)</span></h2>
            {weeklyBars.every(b => b.count === 0) ? (
              <p className="text-sm text-muted text-center py-8">No data yet</p>
            ) : (
              <>
                <BarChart bars={weeklyBars} maxVal={maxWeekly} />
                <p className="text-[10px] text-muted font-mono mt-2 text-right">
                  avg {Math.round(weeklyBars.reduce((s, b) => s + b.count, 0) / 8)} entries/week
                </p>
              </>
            )}
          </div>
        </div>

        {/* ── Day of week heatmap ── */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-xs font-mono text-muted uppercase tracking-widest mb-4">
            Most active day
            {mostActiveDay && <span className="ml-2 text-accent">{mostActiveDay}</span>}
          </h2>
          <div className="flex gap-2 sm:gap-4">
            {DAY_LABELS.map((day, i) => {
              const count = dowCounts[i] ?? 0
              const pct   = maxDow > 0 ? count / maxDow : 0
              const alpha = 0.1 + pct * 0.9
              return (
                <div key={day} className="flex flex-col items-center gap-2 flex-1">
                  <div
                    className="w-full aspect-square rounded-lg transition-all duration-300 flex items-center justify-center"
                    style={{ backgroundColor: `rgba(129,140,248,${alpha})` }}
                  >
                    <span className="text-[10px] font-mono" style={{ color: pct > 0.5 ? '#fff' : 'var(--color-muted)' }}>
                      {count > 0 ? count : ''}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-muted">{day}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Milestones ── */}
        {totalEntries > 0 && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-xs font-mono text-muted uppercase tracking-widest mb-4">Milestones</h2>
            <div className="flex flex-wrap gap-2">
              {[
                { reached: totalEntries >= 1,   label: 'First entry',         icon: '🌱' },
                { reached: totalEntries >= 10,  label: '10 entries',          icon: '📗' },
                { reached: totalEntries >= 50,  label: '50 entries',          icon: '🔥' },
                { reached: totalEntries >= 100, label: '100 entries',         icon: '💎' },
                { reached: currentStreak >= 3,  label: '3-day streak',        icon: '⚡' },
                { reached: currentStreak >= 7,  label: 'Week streak',         icon: '🗓️' },
                { reached: currentStreak >= 30, label: 'Month streak',        icon: '🏆' },
                { reached: bestStreak >= 7,     label: '7-day best streak',   icon: '🎯' },
                { reached: activeDays >= 30,    label: '30 active days',      icon: '🌟' },
              ].map(m => (
                <div
                  key={m.label}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono border transition-all ${
                    m.reached
                      ? 'border-accent/40 bg-accent/10 text-accent'
                      : 'border-border/40 bg-surface/50 text-muted/40 grayscale'
                  }`}
                >
                  <span>{m.icon}</span>
                  <span>{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── AI Insights (coming soon placeholder) ── */}
        <div className="bg-card border border-border rounded-xl p-5 relative overflow-hidden">
          {/* Glow effect */}
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-5 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #818cf8, transparent)', transform: 'translate(30%, -30%)' }} />

          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={15} className="text-accent" />
            <h2 className="text-xs font-mono text-muted uppercase tracking-widest">AI Insights</h2>
            <span className="text-[10px] font-mono bg-accent/20 text-accent px-2 py-0.5 rounded-full ml-auto">
              Coming soon
            </span>
          </div>

          <div className="rounded-lg border border-dashed border-border/60 p-5 text-center">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
              <TrendingUp size={18} className="text-accent" />
            </div>
            <p className="text-sm text-secondary font-body mb-1">Weekly synthesis & insights</p>
            <p className="text-xs text-muted font-body max-w-sm mx-auto">
              Soon, an AI will read your entries and surface patterns — what you're building, what you're learning, and where you're spending your energy.
            </p>
            <div className="flex items-center justify-center gap-4 mt-4">
              <div className="flex items-center gap-1.5 text-xs text-muted font-mono">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                Powered by Groq (free)
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted font-mono">
                <div className="w-2 h-2 rounded-full bg-accent" />
                Llama 3 70B
              </div>
            </div>
          </div>
        </div>

        {/* ── Recent entries ── */}
        {stats?.recentEntries && stats.recentEntries.length > 0 && (
          <div>
            <h2 className="text-xs font-mono text-muted uppercase tracking-widest mb-3">Recent entries</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.recentEntries.slice(0, 6).map(entry => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onEdit={() => selectDate(parseISO(entry.entryDate))}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}