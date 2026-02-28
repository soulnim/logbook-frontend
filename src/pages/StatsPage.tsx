import { useState, useEffect, useMemo } from 'react'
import { format, parseISO, subDays, getDay } from 'date-fns'
import {
  BarChart2, Flame, CalendarDays, TrendingUp, Sparkles,
  BookOpen, Zap, Brain, GitCommit, Star, Send, RefreshCw,
  Target, AlertTriangle, CheckCircle2, X,
} from 'lucide-react'
import { statsApi } from '../api/stats'
import { goalsApi } from '../api/goals'
import { aiApi, type InsightType, type InsightResponse } from '../api/ai'
import { Navbar } from '../components/layout/Navbar'
import { EntryCard } from '../components/entry/EntryCard'
import { useEntryStore } from '../store/entryStore'
import { entriesApi } from '../api/entries'
import type { StatsData, HeatmapData, EntryType, GoalSummary, Entry } from '../types'
import { ENTRY_TYPE_META } from '../types'

// ── Insight type config ───────────────────────────────────────────────────────

const INSIGHT_OPTIONS: {
  type: InsightType
  label: string
  emoji: string
  description: string
  period: string
}[] = [
  { type: 'WEEKLY_SUMMARY',    label: 'Weekly summary',    emoji: '📋', description: 'What did I do this week?',       period: '7 days'  },
  { type: 'LEARNING_PATTERNS', label: 'What am I learning?', emoji: '🧠', description: 'Patterns from my skill entries', period: '30 days' },
  { type: 'PRODUCTIVITY_CHECK',label: 'Productivity check', emoji: '⚡', description: 'How are my tasks going?',        period: '30 days' },
  { type: 'COMMIT_DIGEST',     label: 'Commit digest',     emoji: '🔀', description: 'Summarise my GitHub commits',    period: '7 days'  },
  { type: 'MOTIVATE_ME',       label: 'Motivate me',       emoji: '💬', description: 'Encouragement from my progress', period: '7 days'  },
  { type: 'GOALS_CHECK',        label: 'Goals check',       emoji: '🎯', description: 'How are my goals going?',        period: 'active'  },
]

// ── Mini chart components ─────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, React.ElementType> = {
  NOTE: BookOpen, SKILL: Brain, ACTION: Zap, EVENT: CalendarDays, COMMIT: GitCommit,
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function buildWeeklyBars(data: HeatmapData['data']) {
  const today = new Date()
  return Array.from({ length: 8 }, (_, i) => {
    const weekEnd   = subDays(today, (7 - i) * 7)
    const weekStart = subDays(weekEnd, 6)
    const count = data
      .filter(d => { const date = parseISO(d.date); return date >= weekStart && date <= weekEnd })
      .reduce((s, d) => s + d.count, 0)
    return { label: format(weekStart, 'MMM d'), count }
  })
}

function buildDowCounts(data: HeatmapData['data']) {
  const counts = [0, 0, 0, 0, 0, 0, 0]
  data.forEach(d => { counts[getDay(parseISO(d.date))] += d.count })
  return counts
}

function DonutChart({ segments }: { segments: { color: string; value: number }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0)
  if (total === 0) return <div className="w-28 h-28 rounded-full bg-surface border border-border" />
  const r = 40, cx = 50, cy = 50, circ = 2 * Math.PI * r
  let offset = 0
  const slices = segments.map(s => {
    const dash = (s.value / total) * circ
    const slice = { ...s, dash, gap: circ - dash, offset }
    offset += dash
    return slice
  })
  return (
    <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
      {slices.map((s, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth="16"
          strokeDasharray={`${s.dash} ${s.gap}`} strokeDashoffset={-s.offset}
          className="transition-all duration-500" />
      ))}
      <circle cx={cx} cy={cy} r="32" className="fill-card" />
    </svg>
  )
}

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; color: string
}) {
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

// ── AI Insights panel ─────────────────────────────────────────────────────────

function AiInsightsPanel() {
  const [selected,   setSelected]   = useState<InsightType | null>(null)
  const [focusNote,  setFocusNote]  = useState('')
  const [isLoading,  setIsLoading]  = useState(false)
  const [result,     setResult]     = useState<InsightResponse | null>(null)
  const [error,      setError]      = useState('')

  const handleGenerate = async () => {
    if (!selected) return
    setIsLoading(true)
    setResult(null)
    setError('')
    try {
      const res = await aiApi.getInsight({
        insightType: selected,
        focusNote:   focusNote.trim() || undefined,
      })
      setResult(res)
    } catch {
      setError('Could not reach the AI. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setError('')
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-[0.04] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #818cf8, transparent)', transform: 'translate(40%, -40%)' }} />

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={15} className="text-accent" />
        <h2 className="text-xs font-mono text-muted uppercase tracking-widest">AI Insights</h2>
        <div className="flex items-center gap-1.5 ml-auto text-[10px] font-mono text-muted/60">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Llama 3.1 · Groq
        </div>
      </div>

      {/* Result view */}
      {result ? (
        <div className="animate-fade-in">
          {/* Result header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-xs font-mono text-muted">
                {INSIGHT_OPTIONS.find(o => o.type === result.insightType)?.emoji}{' '}
                {INSIGHT_OPTIONS.find(o => o.type === result.insightType)?.label}
              </p>
              {result.hasData && (
                <p className="text-[10px] text-muted/60 font-mono mt-0.5">
                  Based on {result.entryCount} entr{result.entryCount === 1 ? 'y' : 'ies'} · {result.dateRange}
                </p>
              )}
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-xs text-muted hover:text-secondary font-mono transition-colors shrink-0"
            >
              <RefreshCw size={11} /> New insight
            </button>
          </div>

          {/* Insight text */}
          {!result.hasData ? (
            <div className="bg-surface/50 rounded-lg p-4 border border-border/50">
              <p className="text-sm text-muted font-body">{result.insight}</p>
            </div>
          ) : (
            <div className="bg-surface/50 rounded-lg p-4 border border-border/50 space-y-3">
              {result.insight.split('\n\n').map((para: string, i: number) => (
                <p key={i} className="text-sm text-secondary font-body leading-relaxed whitespace-pre-wrap">
                  {para}
                </p>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Picker */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {INSIGHT_OPTIONS.map(opt => (
              <button
                key={opt.type}
                onClick={() => setSelected(opt.type)}
                className={`text-left p-3 rounded-lg border transition-all ${
                  selected === opt.type
                    ? 'border-accent/50 bg-accent/10'
                    : 'border-border hover:border-accent/30 bg-card'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-base leading-none">{opt.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-primary leading-tight">{opt.label}</p>
                    <p className="text-[10px] text-muted mt-0.5 leading-tight">{opt.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Optional focus note */}
          {selected && (
            <div className="mb-4 animate-fade-in">
              <label className="text-xs font-mono text-muted block mb-1.5">
                Focus on… <span className="text-muted/50">(optional)</span>
              </label>
              <input
                value={focusNote}
                onChange={e => setFocusNote(e.target.value)}
                placeholder="e.g., 'React hooks' or 'project X'"
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors font-body"
              />
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!selected || isLoading}
            className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2.5 text-sm font-mono transition-colors"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                <Send size={13} />
                Generate insight
              </>
            )}
          </button>

          {error && (
            <div className="mt-3 p-3 bg-red-400/10 border border-red-400/30 rounded-lg">
              <p className="text-xs text-red-400 font-mono">{error}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Main Stats Page ───────────────────────────────────────────────────────────

export function StatsPage() {
  const { selectDate } = useEntryStore()
  const [stats,        setStats]        = useState<StatsData | null>(null)
  const [heatmap,      setHeatmap]      = useState<HeatmapData | null>(null)
  const [goalSummary,  setGoalSummary]  = useState<GoalSummary | null>(null)
  const [isLoading,    setIsLoading]    = useState(true)

  // ── Search state ──
  const [searchQuery,   setSearchQuery]   = useState('')
  const [searchResults, setSearchResults] = useState<Entry[] | null>(null)
  const [isSearching,   setIsSearching]   = useState(false)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const [s, h, g] = await Promise.all([
          statsApi.getStats(),
          statsApi.getHeatmap(),
          goalsApi.getSummary(),
        ])
        setStats(s)
        setHeatmap(h)
        setGoalSummary(g)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  // ── Search entries with debounce ──
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null)
      return
    }
    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await entriesApi.search(searchQuery)
        setSearchResults(results)
      } finally {
        setIsSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!stats || !heatmap) return null

  const { totalEntries: total, activeDays: active, currentStreak: current, longestStreak: longest, byType } = stats

  const typeSegments = (Object.keys(byType) as EntryType[])
    .map(type => ({ type, value: byType[type], color: ENTRY_TYPE_META[type].color }))
    .filter(s => s.value > 0)
    .sort((a, b) => b.value - a.value)

  const weeklyBars = buildWeeklyBars(heatmap.data)
  const maxWeekly = Math.max(...weeklyBars.map(b => b.count), 1)

  const dowCounts = buildDowCounts(heatmap.data)
  const maxDow = Math.max(...dowCounts, 1)
  const bestDowIdx = dowCounts.indexOf(maxDow)
  const bestDow = maxDow > 0 ? DAY_LABELS[bestDowIdx] : null

  return (
    <div className="min-h-screen bg-bg text-primary flex flex-col font-body">
      <div className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: `linear-gradient(#818cf8 1px, transparent 1px), linear-gradient(90deg, #818cf8 1px, transparent 1px)`, backgroundSize: '48px 48px' }} />

      <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} showSearch={true} />

      <main className="relative z-0 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col gap-6">

        {/* ── Search results overlay ── */}
        {searchResults !== null && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-secondary font-body">
                {isSearching ? 'Searching...' : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} for "${searchQuery}"`}
              </p>
              <button
                onClick={clearSearch}
                className="text-xs text-muted hover:text-secondary font-mono flex items-center gap-1"
              >
                <X size={11} /> Clear
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
              <div className="text-center py-12 text-secondary text-sm">
                No entries found
              </div>
            )}
          </div>
        )}

        {/* ── Stats content (only show when not searching) ── */}
        {searchResults === null && (
          <>
            {/* Page header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <BarChart2 size={18} className="text-accent" />
                  <h1 className="text-2xl font-display font-semibold text-primary tracking-tight">Stats</h1>
                </div>
                <p className="text-sm text-secondary font-body">Your progress at a glance</p>
              </div>
            </div>

            {/* Top stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Total entries" value={total} icon={BookOpen} color="#818cf8" />
              <StatCard label="Active days" value={active} icon={CalendarDays} color="#34d399" />
              <StatCard label="Current streak" value={current} sub={current > 0 ? '🔥 Keep it up!' : ''} icon={Flame} color="#f59e0b" />
              <StatCard label="Best streak" value={longest} icon={TrendingUp} color="#f472b6" />
            </div>

            {/* Entry type breakdown + weekly bars */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-xs font-mono text-muted uppercase tracking-widest mb-4">Entry types</h2>
                {typeSegments.length === 0 ? (
                  <p className="text-sm text-muted text-center py-8">No data yet</p>
                ) : (
                  <div className="flex items-center gap-6">
                    <DonutChart segments={typeSegments} />
                    <div className="flex flex-col gap-2.5 flex-1">
                      {typeSegments.map(seg => {
                        const tot = typeSegments.reduce((s, x) => s + x.value, 0)
                        const pct = tot > 0 ? Math.round((seg.value / tot) * 100) : 0
                        const Icon = TYPE_ICONS[seg.type] ?? BookOpen
                        return (
                          <div key={seg.type} className="flex items-center gap-2">
                            <Icon size={12} style={{ color: seg.color }} />
                            <span className="text-xs font-mono text-secondary flex-1">
                              {ENTRY_TYPE_META[seg.type as EntryType].label}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="w-14 h-1.5 bg-surface rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%`, backgroundColor: seg.color }} />
                              </div>
                              <span className="text-xs font-mono text-primary w-6 text-right">{seg.value}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-xs font-mono text-muted uppercase tracking-widest mb-4">
                  Weekly activity <span className="text-muted/50">(last 8 weeks)</span>
                </h2>
                {weeklyBars.every(b => b.count === 0) ? (
                  <p className="text-sm text-muted text-center py-8">No data yet</p>
                ) : (
                  <>
                    <div className="flex items-end gap-1.5 h-28">
                      {weeklyBars.map((bar, i) => {
                        const pct = maxWeekly > 0 ? (bar.count / maxWeekly) * 100 : 0
                        return (
                          <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                            <span className="text-[9px] font-mono text-muted">{bar.count > 0 ? bar.count : ''}</span>
                            <div className="w-full rounded-t-sm transition-all duration-500"
                              style={{
                                height: `${Math.max(pct, bar.count > 0 ? 4 : 2)}%`,
                                backgroundColor: i === weeklyBars.length - 1 ? 'var(--color-accent)' : 'rgba(129,140,248,0.3)',
                              }} />
                            <span className="text-[9px] font-mono text-muted truncate w-full text-center hidden sm:block">
                              {bar.label.split(' ')[0]}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                    <p className="text-[10px] text-muted font-mono mt-2 text-right">
                      avg {Math.round(weeklyBars.reduce((s, b) => s + b.count, 0) / 8)} entries/week
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Day-of-week heatmap */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-xs font-mono text-muted uppercase tracking-widest mb-4">
                Most active day {bestDow && <span className="text-accent ml-1">{bestDow}</span>}
              </h2>
              <div className="flex gap-2 sm:gap-3">
                {DAY_LABELS.map((day, i) => {
                  const count = dowCounts[i] ?? 0
                  const alpha = maxDow > 0 ? 0.1 + (count / maxDow) * 0.9 : 0.1
                  return (
                    <div key={day} className="flex flex-col items-center gap-2 flex-1">
                      <div className="w-full aspect-square rounded-lg flex items-center justify-center transition-all duration-300"
                        style={{ backgroundColor: `rgba(129,140,248,${alpha})` }}>
                        <span className="text-[10px] font-mono" style={{ color: (count / maxDow) > 0.5 ? '#fff' : 'var(--color-muted)' }}>
                          {count > 0 ? count : ''}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-muted">{day}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── Goals summary ── */}
            {goalSummary && (goalSummary.activeCount > 0 || goalSummary.completedCount > 0) && (
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-mono text-muted uppercase tracking-widest">Goals</h2>
                  <a href="/goals" className="text-xs font-mono text-accent hover:underline">View all →</a>
                </div>
                <div className="flex gap-4 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent/10">
                      <Target size={14} className="text-accent" />
                    </div>
                    <div>
                      <p className="text-lg font-display font-bold text-primary leading-none">{goalSummary.activeCount}</p>
                      <p className="text-[10px] font-mono text-muted">Active</p>
                    </div>
                  </div>
                  {goalSummary.overdueCount > 0 && (
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-400/10">
                        <AlertTriangle size={14} className="text-red-400" />
                      </div>
                      <div>
                        <p className="text-lg font-display font-bold text-red-400 leading-none">{goalSummary.overdueCount}</p>
                        <p className="text-[10px] font-mono text-muted">Overdue</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-400/10">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-lg font-display font-bold text-primary leading-none">{goalSummary.completedCount}</p>
                      <p className="text-[10px] font-mono text-muted">Completed</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── AI Insights ── */}
            <AiInsightsPanel />

            {/* Milestones */}
            {total > 0 && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-xs font-mono text-muted uppercase tracking-widest mb-4">Milestones</h2>
                <div className="flex flex-wrap gap-2">
                  {[
                    { reached: total >= 1,    label: 'First entry',       icon: '🌱' },
                    { reached: total >= 10,   label: '10 entries',        icon: '📗' },
                    { reached: total >= 50,   label: '50 entries',        icon: '🔥' },
                    { reached: total >= 100,  label: '100 entries',       icon: '💎' },
                    { reached: current >= 3,  label: '3-day streak',      icon: '⚡' },
                    { reached: current >= 7,  label: 'Week streak',       icon: '🗓️' },
                    { reached: current >= 30, label: 'Month streak',      icon: '🏆' },
                    { reached: longest >= 7,  label: '7-day best streak', icon: '🎯' },
                    { reached: active >= 30,  label: '30 active days',    icon: '🌟' },
                  ].map(m => (
                    <div key={m.label}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono border transition-all ${
                        m.reached ? 'border-accent/40 bg-accent/10 text-accent' : 'border-border/40 bg-surface/50 text-muted/40 grayscale'
                      }`}>
                      <span>{m.icon}</span>
                      <span>{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent entries */}
            {stats?.recentEntries && stats.recentEntries.length > 0 && (
              <div>
                <h2 className="text-xs font-mono text-muted uppercase tracking-widest mb-3">Recent entries</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {stats.recentEntries.slice(0, 6).map(entry => (
                    <EntryCard key={entry.id} entry={entry} onEdit={() => selectDate(parseISO(entry.entryDate))} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}