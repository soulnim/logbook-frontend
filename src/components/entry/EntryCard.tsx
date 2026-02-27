import { useState } from 'react'
import { Pencil, Trash2, Check, GitCommit, ExternalLink } from 'lucide-react'
import type { Entry, GitHubSourceMeta } from '../../types'
import { ENTRY_TYPE_META, MOOD_LABELS } from '../../types'
import { TagBadge } from '../ui/TagBadge'
import { entriesApi } from '../../api/entries'
import { useEntryStore } from '../../store/entryStore'
import { formatTime } from '../../utils/dateUtils'

interface EntryCardProps {
  entry: Entry
  onEdit: () => void
}

function parseSourceMeta(raw: string | null): GitHubSourceMeta | null {
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

function CommitList({ sourceMeta }: { sourceMeta: GitHubSourceMeta }) {
  const [expanded, setExpanded] = useState(false)
  const commits = sourceMeta.commits ?? []
  const visible = expanded ? commits : commits.slice(0, 3)

  return (
    <div className="mt-2 rounded-lg overflow-hidden border border-border/60">
      {/* Repo header */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-surface text-xs font-mono text-muted border-b border-border/60">
        <GitCommit size={11} />
        <span>{sourceMeta.repoFullName}</span>
        <span className="ml-auto text-[10px] bg-border/60 px-1.5 py-0.5 rounded">
          {sourceMeta.branch}
        </span>
      </div>

      {/* Commits */}
      <div className="divide-y divide-border/40">
        {visible.map(commit => (
          <div key={commit.sha} className="flex items-start gap-2 px-3 py-2 bg-card/50">
            <span className="text-[10px] font-mono text-muted mt-0.5 shrink-0">
              {commit.sha.substring(0, 7)}
            </span>
            <p className="text-xs text-text/80 flex-1 leading-relaxed line-clamp-2">
              {commit.message.split('\n')[0]}
            </p>
            <a
              href={commit.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-accent shrink-0 mt-0.5 transition-colors"
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink size={10} />
            </a>
          </div>
        ))}
      </div>

      {commits.length > 3 && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full text-xs text-muted hover:text-text px-3 py-1.5 bg-surface border-t border-border/60 font-mono transition-colors"
        >
          {expanded ? '▲ Show less' : `▼ Show ${commits.length - 3} more`}
        </button>
      )}
    </div>
  )
}

export function EntryCard({ entry, onEdit }: EntryCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { removeEntry, updateEntry } = useEntryStore()
  const meta = ENTRY_TYPE_META[entry.entryType]
  const sourceMeta = parseSourceMeta(entry.sourceMeta)

  const handleDelete = async () => {
    if (!confirm('Delete this entry?')) return
    setIsDeleting(true)
    try {
      await entriesApi.delete(entry.id)
      removeEntry(entry.id, entry.entryDate)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleComplete = async () => {
    if (entry.entryType !== 'ACTION') return
    const updated = await entriesApi.update(entry.id, { isCompleted: !entry.isCompleted })
    updateEntry(updated)
  }

  return (
    <div
      className="group relative rounded-lg border border-border bg-card p-4 transition-all duration-150 hover:border-accent/20 animate-fade-in"
      style={{ borderLeft: `3px solid ${meta.color}` }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span
            className="text-xs font-mono px-1.5 py-0.5 rounded shrink-0"
            style={{ color: meta.color, backgroundColor: meta.bg }}
          >
            {meta.icon} {meta.label}
          </span>

          {entry.entryType === 'ACTION' && (
            <button
              onClick={handleToggleComplete}
              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                entry.isCompleted
                  ? 'bg-skill border-skill'
                  : 'border-border hover:border-accent/50'
              }`}
            >
              {entry.isCompleted && <Check size={10} className="text-bg" />}
            </button>
          )}
        </div>

        {entry.mood && (
          <span className="text-base shrink-0">{MOOD_LABELS[entry.mood]}</span>
        )}

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={onEdit}
            className="w-6 h-6 flex items-center justify-center rounded text-secondary hover:text-accent transition-colors"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-6 h-6 flex items-center justify-center rounded text-secondary hover:text-red-400 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Title */}
      <h4
        className={`text-sm font-body font-medium text-primary mb-1 ${
          entry.isCompleted ? 'line-through text-muted' : ''
        }`}
      >
        {entry.title}
      </h4>

      {/* COMMIT: show commit list */}
      {entry.entryType === 'COMMIT' && sourceMeta && (
        <CommitList sourceMeta={sourceMeta} />
      )}

      {/* Content / notes */}
      {entry.content && (
        <p className={`text-xs text-secondary font-body leading-relaxed mb-2 line-clamp-3 ${
          entry.entryType === 'COMMIT' ? 'mt-2 italic text-muted' : ''
        }`}>
          {entry.entryType === 'COMMIT' ? `💭 ${entry.content}` : entry.content}
        </p>
      )}

      {/* Event time */}
      {entry.entryType === 'EVENT' && entry.startTime && (
        <p className="text-xs text-muted font-mono mb-2">
          {formatTime(entry.startTime)}
          {entry.endTime && ` → ${formatTime(entry.endTime)}`}
        </p>
      )}

      {/* Tags */}
      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {entry.tags.map(tag => (
            <TagBadge key={tag.id} tag={tag} />
          ))}
        </div>
      )}
    </div>
  )
}