import { useState, useEffect, useCallback, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import {
  Plus, Target, CheckCircle2, Circle, Trash2, Edit3,
  ChevronRight, X, Calendar, Flag, Archive, Trophy,
  AlertTriangle, Loader2,
} from 'lucide-react'
import { goalsApi } from '../api/goals'
import { Navbar } from '../components/layout/Navbar'
import type { Goal, GoalStatus, GoalType, Milestone } from '../types'
import { GOAL_TYPE_META } from '../types'

// ── Colour palette for goal picker ───────────────────────────────────────────

const COLORS = [
  '#818cf8', '#34d399', '#f59e0b', '#f472b6',
  '#38bdf8', '#a78bfa', '#fb923c', '#4ade80',
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function ProgressRing({ percent, color, size = 48 }: { percent: number; color: string; size?: number }) {
  const r   = size / 2 - 5
  const c   = 2 * Math.PI * r
  const dash = (percent / 100) * c

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="rgba(255,255,255,0.07)" strokeWidth="4" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth="4"
        strokeDasharray={`${dash} ${c - dash}`}
        strokeLinecap="round"
        className="transition-all duration-700" />
    </svg>
  )
}

function DeadlineBadge({ goal }: { goal: Goal }) {
  if (!goal.targetDate) return null
  const MAX = 9007199254740991 // Number.MAX_SAFE_INTEGER
  if (goal.daysUntilDeadline >= MAX) return null

  if (goal.overdue) return (
    <span className="flex items-center gap-1 text-[10px] font-mono text-red-400">
      <AlertTriangle size={10} /> {Math.abs(goal.daysUntilDeadline)}d overdue
    </span>
  )
  if (goal.daysUntilDeadline <= 7) return (
    <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400">
      <Flag size={10} /> {goal.daysUntilDeadline}d left
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-[10px] font-mono text-muted">
      <Calendar size={10} /> {format(parseISO(goal.targetDate), 'MMM d, yyyy')}
    </span>
  )
}

// ── Goal Card ─────────────────────────────────────────────────────────────────

function GoalCard({ goal, onSelect }: { goal: Goal; onSelect: (g: Goal) => void }) {
  const meta  = GOAL_TYPE_META[goal.type]
  const allDone = goal.totalMilestones > 0 && goal.progressPercent === 100

  return (
    <button
      onClick={() => onSelect(goal)}
      className="w-full text-left bg-card border border-border rounded-xl p-4 hover:border-accent/40 transition-all duration-150 group flex flex-col gap-3"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          {/* Color dot + type */}
          <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: goal.color }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-display font-semibold text-primary leading-snug truncate">{goal.title}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[10px] font-mono text-muted">{meta.icon} {meta.label}</span>
              <DeadlineBadge goal={goal} />
            </div>
          </div>
        </div>

        {/* Progress ring */}
        <div className="relative shrink-0">
          <ProgressRing percent={goal.progressPercent} color={goal.color} size={44} />
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-primary">
            {goal.progressPercent}%
          </span>
        </div>
      </div>

      {/* Description */}
      {goal.description && (
        <p className="text-xs text-muted font-body line-clamp-2 leading-relaxed">{goal.description}</p>
      )}

      {/* Progress bar */}
      <div className="flex flex-col gap-1.5">
        <div className="h-1.5 bg-surface rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${goal.progressPercent}%`, backgroundColor: goal.color }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-muted">
            {goal.completedMilestones}/{goal.totalMilestones} milestones
          </span>
          {allDone && (
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <Trophy size={10} /> All done!
            </span>
          )}
          <ChevronRight size={12} className="text-muted group-hover:text-accent transition-colors" />
        </div>
      </div>
    </button>
  )
}

// ── Goal Side Panel ───────────────────────────────────────────────────────────

function GoalPanel({
  goal, onClose, onUpdated, onDeleted,
}: {
  goal: Goal
  onClose: () => void
  onUpdated: (g: Goal) => void
  onDeleted: (id: number) => void
}) {
  const [newMilestone,   setNewMilestone]   = useState('')
  const [addingMilestone, setAddingMilestone] = useState(false)
  const [editingTitle,   setEditingTitle]   = useState(false)
  const [titleDraft,     setTitleDraft]     = useState(goal.title)
  const [isDeleting,     setIsDeleting]     = useState(false)
  const [confirmDelete,  setConfirmDelete]  = useState(false)

  const meta    = GOAL_TYPE_META[goal.type]
  const allDone = goal.totalMilestones > 0 && goal.progressPercent === 100

  const handleToggleMilestone = async (m: Milestone) => {
    const updated = await goalsApi.updateMilestone(goal.id, m.id, { isCompleted: !m.isCompleted })
    onUpdated(updated)
  }

  const handleAddMilestone = async () => {
    if (!newMilestone.trim()) return
    setAddingMilestone(true)
    try {
      const updated = await goalsApi.addMilestone(goal.id, { title: newMilestone.trim() })
      onUpdated(updated)
      setNewMilestone('')
    } finally { setAddingMilestone(false) }
  }

  const handleDeleteMilestone = async (m: Milestone) => {
    const updated = await goalsApi.deleteMilestone(goal.id, m.id)
    onUpdated(updated)
  }

  const handleSaveTitle = async () => {
    if (!titleDraft.trim() || titleDraft === goal.title) { setEditingTitle(false); return }
    const updated = await goalsApi.update(goal.id, { title: titleDraft.trim() })
    onUpdated(updated)
    setEditingTitle(false)
  }

  const handleStatusChange = async (status: GoalStatus) => {
    const updated = await goalsApi.updateStatus(goal.id, status)
    onUpdated(updated)
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setIsDeleting(true)
    await goalsApi.delete(goal.id)
    onDeleted(goal.id)
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-x-0 bottom-0 top-14 z-20 bg-bg/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-14 bottom-0 z-30 w-full max-w-md bg-surface border-l border-border flex flex-col shadow-2xl animate-slide-in">

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border shrink-0 gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: goal.color }} />
              <span className="text-xs font-mono text-muted">{meta.icon} {meta.label}</span>
              {goal.status === 'COMPLETED' && (
                <span className="text-[10px] font-mono bg-emerald-400/15 text-emerald-400 px-2 py-0.5 rounded-full">
                  Completed
                </span>
              )}
              {goal.status === 'ARCHIVED' && (
                <span className="text-[10px] font-mono bg-muted/15 text-muted px-2 py-0.5 rounded-full">
                  Archived
                </span>
              )}
            </div>

            {editingTitle ? (
              <input
                autoFocus
                value={titleDraft}
                onChange={e => setTitleDraft(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') setEditingTitle(false) }}
                className="w-full bg-transparent text-lg font-display font-semibold text-primary focus:outline-none border-b border-accent"
              />
            ) : (
              <button
                onClick={() => setEditingTitle(true)}
                className="flex items-start gap-1.5 group text-left"
              >
                <span className="text-lg font-display font-semibold text-primary leading-snug">{goal.title}</span>
                <Edit3 size={12} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity mt-1.5 shrink-0" />
              </button>
            )}

            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <DeadlineBadge goal={goal} />
              {goal.targetDate && (
                <span className="text-[10px] font-mono text-muted">
                  Due {format(parseISO(goal.targetDate), 'MMM d, yyyy')}
                </span>
              )}
            </div>
          </div>

          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-md text-secondary hover:text-primary hover:bg-hover transition-colors shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5 min-h-0">

          {/* Progress summary */}
          <div className="flex items-center gap-4 p-3 bg-card rounded-xl border border-border">
            <div className="relative">
              <ProgressRing percent={goal.progressPercent} color={goal.color} size={56} />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold text-primary">
                {goal.progressPercent}%
              </span>
            </div>
            <div>
              <p className="text-sm font-display font-semibold text-primary">
                {goal.completedMilestones} of {goal.totalMilestones} done
              </p>
              <p className="text-xs text-muted font-mono mt-0.5">
                {goal.totalMilestones === 0
                  ? 'Add milestones to track progress'
                  : allDone ? '🎉 All milestones complete!' : `${goal.totalMilestones - goal.completedMilestones} remaining`
                }
              </p>
            </div>
          </div>

          {/* Description */}
          {goal.description && (
            <div>
              <p className="text-xs font-mono text-muted uppercase tracking-widest mb-2">About</p>
              <p className="text-sm text-secondary font-body leading-relaxed">{goal.description}</p>
            </div>
          )}

          {/* Milestones */}
          <div>
            <p className="text-xs font-mono text-muted uppercase tracking-widest mb-3">Milestones</p>

            {/* List */}
            {goal.milestones.length > 0 ? (
              <div className="flex flex-col gap-1.5 mb-3">
                {goal.milestones.map(m => (
                  <div key={m.id} className="flex items-center gap-2.5 group p-2 rounded-lg hover:bg-hover transition-colors">
                    <button
                      onClick={() => handleToggleMilestone(m)}
                      className="shrink-0 transition-colors"
                      style={{ color: m.isCompleted ? goal.color : undefined }}
                    >
                      {m.isCompleted
                        ? <CheckCircle2 size={18} />
                        : <Circle size={18} className="text-muted" />
                      }
                    </button>
                    <span className={`flex-1 text-sm font-body ${m.isCompleted ? 'line-through text-muted' : 'text-primary'}`}>
                      {m.title}
                    </span>
                    <button
                      onClick={() => handleDeleteMilestone(m)}
                      className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted font-body italic mb-3">No milestones yet — add some below</p>
            )}

            {/* Add milestone input */}
            <div className="flex gap-2">
              <input
                value={newMilestone}
                onChange={e => setNewMilestone(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddMilestone() }}
                placeholder="Add a milestone..."
                className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-sm text-primary font-body placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors"
              />
              <button
                onClick={handleAddMilestone}
                disabled={!newMilestone.trim() || addingMilestone}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-accent text-white disabled:opacity-40 hover:bg-accent/90 transition-colors"
              >
                {addingMilestone ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2 border-t border-border">
            <p className="text-xs font-mono text-muted uppercase tracking-widest mb-1">Actions</p>

            {goal.status === 'ACTIVE' && (
              <button
                onClick={() => handleStatusChange('COMPLETED')}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-400/10 text-sm font-mono transition-colors"
              >
                <Trophy size={14} /> Mark as completed
              </button>
            )}

            {goal.status === 'ACTIVE' && (
              <button
                onClick={() => handleStatusChange('ARCHIVED')}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border text-secondary hover:bg-hover text-sm font-mono transition-colors"
              >
                <Archive size={14} /> Archive
              </button>
            )}

            {(goal.status === 'COMPLETED' || goal.status === 'ARCHIVED') && (
              <button
                onClick={() => handleStatusChange('ACTIVE')}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border text-secondary hover:bg-hover text-sm font-mono transition-colors"
              >
                <Target size={14} /> Reactivate
              </button>
            )}

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-mono transition-colors ${
                confirmDelete
                  ? 'border-red-500/50 bg-red-500/10 text-red-400'
                  : 'border-border text-muted hover:border-red-400/30 hover:text-red-400'
              }`}
            >
              {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              {confirmDelete ? 'Click again to confirm delete' : 'Delete goal'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Add Goal Modal ────────────────────────────────────────────────────────────

function AddGoalModal({ onClose, onCreated }: { onClose: () => void; onCreated: (g: Goal) => void }) {
  const [title,      setTitle]      = useState('')
  const [description,setDescription]= useState('')
  const [type,       setType]       = useState<GoalType>('PERSONAL')
  const [color,      setColor]      = useState('#818cf8')
  const [targetDate, setTargetDate] = useState('')
  const [isLoading,  setIsLoading]  = useState(false)
  const [error,      setError]      = useState('')

  const handleCreate = async () => {
    if (!title.trim()) { setError('Title is required'); return }
    setIsLoading(true)
    try {
      const goal = await goalsApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        color,
        targetDate: targetDate || undefined,
      })
      onCreated(goal)
    } catch {
      setError('Failed to create goal. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in">

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-display font-semibold text-primary">New Goal</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md text-muted hover:text-secondary hover:bg-hover">
            <X size={15} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Title */}
          <div>
            <label className="text-xs font-mono text-muted uppercase tracking-widest block mb-1.5">Title *</label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="What do you want to achieve?"
              className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-primary font-body placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-xs font-mono text-muted uppercase tracking-widest block mb-1.5">Type</label>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(GOAL_TYPE_META) as [GoalType, typeof GOAL_TYPE_META[GoalType]][]).map(([t, meta]) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                    type === t ? 'border-transparent text-white' : 'border-border text-secondary hover:border-accent/30'
                  }`}
                  style={type === t ? { backgroundColor: meta.color } : {}}
                >
                  {meta.icon} {meta.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="text-xs font-mono text-muted uppercase tracking-widest block mb-1.5">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-all duration-150"
                  style={{
                    backgroundColor: c,
                    outline: color === c ? `3px solid ${c}` : '2px solid transparent',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-mono text-muted uppercase tracking-widest block mb-1.5">Description <span className="text-muted/50">(optional)</span></label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="A short description..."
              rows={2}
              className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-primary font-body placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors resize-none"
            />
          </div>

          {/* Target date */}
          <div>
            <label className="text-xs font-mono text-muted uppercase tracking-widest block mb-1.5">Deadline <span className="text-muted/50">(optional)</span></label>
            <input
              type="date"
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
              className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-primary font-body focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>

          {error && <p className="text-xs text-red-400 font-mono">{error}</p>}

          <button
            onClick={handleCreate}
            disabled={isLoading || !title.trim()}
            className="flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-4 py-2.5 text-sm font-mono transition-colors"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Create goal
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Goals Page ───────────────────────────────────────────────────────────

const STATUS_TABS: { value: GoalStatus | 'ALL'; label: string }[] = [
  { value: 'ALL',       label: 'All'       },
  { value: 'ACTIVE',    label: 'Active'    },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ARCHIVED',  label: 'Archived'  },
]

export function GoalsPage() {
  const [goals,        setGoals]        = useState<Goal[]>([])
  const [isLoading,    setIsLoading]    = useState(true)
  const [activeTab,    setActiveTab]    = useState<GoalStatus | 'ALL'>('ACTIVE')
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery,  setSearchQuery]  = useState('')

  const loadGoals = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = activeTab === 'ALL'
        ? await goalsApi.getAll()
        : await goalsApi.getAll(activeTab)
      setGoals(data)
    } finally {
      setIsLoading(false)
    }
  }, [activeTab])

  useEffect(() => { loadGoals() }, [loadGoals])

  const handleGoalUpdated = (updated: Goal) => {
    setGoals(prev => prev.map(g => g.id === updated.id ? updated : g))
    setSelectedGoal(updated)
  }

  const handleGoalDeleted = (id: number) => {
    setGoals(prev => prev.filter(g => g.id !== id))
    setSelectedGoal(null)
  }

  const handleGoalCreated = (goal: Goal) => {
    setGoals(prev => [goal, ...prev])
    setShowAddModal(false)
    setSelectedGoal(goal)
  }

  // Summary counts
  const activeCount    = goals.filter(g => g.status === 'ACTIVE').length
  const overdueCount   = goals.filter(g => g.overdue).length
  const completedCount = goals.filter(g => g.status === 'COMPLETED').length

  const filteredGoals = useMemo(() => {
    if (!searchQuery.trim()) return goals
    const q = searchQuery.toLowerCase()
    return goals.filter(g =>
      g.title.toLowerCase().includes(q) ||
      g.description?.toLowerCase().includes(q) ||
      g.milestones.some(m => m.title.toLowerCase().includes(q))
    )
  }, [goals, searchQuery])

  return (
    <div className="min-h-screen bg-bg text-primary flex flex-col font-body">
      <div className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: `linear-gradient(#818cf8 1px, transparent 1px), linear-gradient(90deg, #818cf8 1px, transparent 1px)`, backgroundSize: '48px 48px' }} />

      <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main className="relative z-0 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col gap-6">

        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target size={18} className="text-accent" />
              <h1 className="text-2xl font-display font-semibold text-primary tracking-tight">Goals</h1>
            </div>
            <p className="text-sm text-secondary font-body">
              Track what you're working towards
              {searchQuery && (
                <span className="ml-2 text-accent font-mono">
                  · {filteredGoals.length} result{filteredGoals.length !== 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-white rounded-xl px-4 py-2.5 text-sm font-mono transition-colors shrink-0"
          >
            <Plus size={14} /> New goal
          </button>
        </div>

        {/* Summary strip */}
        {!isLoading && goals.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Active',    value: activeCount,    color: '#818cf8', icon: Target    },
              { label: 'Overdue',   value: overdueCount,   color: '#ef4444', icon: AlertTriangle },
              { label: 'Completed', value: completedCount, color: '#34d399', icon: CheckCircle2 },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}20` }}>
                  <Icon size={14} style={{ color }} />
                </div>
                <div>
                  <p className="text-lg font-display font-bold text-primary leading-none">{value}</p>
                  <p className="text-[10px] font-mono text-muted">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-1 bg-card border border-border rounded-lg p-1 w-fit">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${
                activeTab === tab.value
                  ? 'bg-accent/15 text-accent'
                  : 'text-secondary hover:text-primary hover:bg-hover'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Goals grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          </div>
        ) : filteredGoals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center mb-4">
              <Target size={24} className="text-muted" />
            </div>
            <p className="text-secondary font-body mb-1">
              {searchQuery
                ? `No goals found for "${searchQuery}"`
                : activeTab === 'ALL' ? 'No goals yet' : `No ${activeTab.toLowerCase()} goals`
              }
            </p>
            <p className="text-xs text-muted font-body mb-4">
              {!searchQuery && (activeTab === 'ACTIVE' || activeTab === 'ALL') ? 'Create your first goal to start tracking progress' : ''}
            </p>
            {!searchQuery && (activeTab === 'ACTIVE' || activeTab === 'ALL') && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 text-accent hover:text-accent/80 text-sm font-mono transition-colors"
              >
                <Plus size={14} /> Create a goal
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onSelect={setSelectedGoal}
              />
            ))}
          </div>
        )}
      </main>

      {/* Side panel */}
      {selectedGoal && (
        <GoalPanel
          goal={selectedGoal}
          onClose={() => setSelectedGoal(null)}
          onUpdated={handleGoalUpdated}
          onDeleted={handleGoalDeleted}
        />
      )}

      {/* Add modal */}
      {showAddModal && (
        <AddGoalModal
          onClose={() => setShowAddModal(false)}
          onCreated={handleGoalCreated}
        />
      )}
    </div>
  )
}