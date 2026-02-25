import { useState } from 'react'
import { Pencil, Trash2, Check } from 'lucide-react'
import type { Entry } from '../../types'
import { ENTRY_TYPE_META, MOOD_LABELS } from '../../types'
import { TagBadge } from '../ui/TagBadge'
import { entriesApi } from '../../api/entries'
import { useEntryStore } from '../../store/entryStore'
import { formatTime } from '../../utils/dateUtils'

interface EntryCardProps {
  entry: Entry
  onEdit: () => void
}

export function EntryCard({ entry, onEdit }: EntryCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { removeEntry, updateEntry } = useEntryStore()
  const meta = ENTRY_TYPE_META[entry.entryType]

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
          {/* Type badge */}
          <span
            className="text-xs font-mono px-1.5 py-0.5 rounded shrink-0"
            style={{ color: meta.color, backgroundColor: meta.bg }}
          >
            {meta.icon} {meta.label}
          </span>

          {/* Action completion toggle */}
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

        {/* Mood */}
        {entry.mood && (
          <span className="text-base shrink-0">{MOOD_LABELS[entry.mood]}</span>
        )}

        {/* Actions — visible on hover */}
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

      {/* Content */}
      {entry.content && (
        <p className="text-xs text-secondary font-body leading-relaxed mb-2 line-clamp-3">
          {entry.content}
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