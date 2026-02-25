import { useState, useEffect } from 'react'
import { X, Plus } from 'lucide-react'
import type { Entry, EntryType, CreateEntryRequest } from '../../types'
import { ENTRY_TYPE_META } from '../../types'
import { Button } from '../ui/Button'
import { Input, Textarea, Select } from '../ui/Input'
import { TagBadge } from '../ui/TagBadge'
import { entriesApi } from '../../api/entries'
import { useEntryStore } from '../../store/entryStore'
import { toDateKey } from '../../utils/dateUtils'

interface EntryFormProps {
  date: Date
  entry?: Entry | null   // if editing
  onClose: () => void
}

const TYPE_OPTIONS = Object.entries(ENTRY_TYPE_META).map(([value, meta]) => ({
  value,
  label: `${meta.icon} ${meta.label}`,
}))

const MOOD_OPTIONS = [
  { value: '', label: 'No mood' },
  { value: '1', label: '😞 Rough' },
  { value: '2', label: '😕 Meh' },
  { value: '3', label: '😐 Okay' },
  { value: '4', label: '🙂 Good' },
  { value: '5', label: '😄 Great' },
]

export function EntryForm({ date, entry, onClose }: EntryFormProps) {
  const { addEntry, updateEntry } = useEntryStore()
  const isEditing = !!entry

  const [title, setTitle]         = useState(entry?.title || '')
  const [content, setContent]     = useState(entry?.content || '')
  const [entryType, setEntryType] = useState<EntryType>(entry?.entryType || 'NOTE')
  const [mood, setMood]           = useState(entry?.mood?.toString() || '')
  const [startTime, setStartTime] = useState(entry?.startTime || '')
  const [endTime, setEndTime]     = useState(entry?.endTime || '')
  const [tagInput, setTagInput]   = useState('')
  const [tags, setTags]           = useState<string[]>(entry?.tags.map(t => t.name) || [])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState('')

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) setTags([...tags, t])
    setTagInput('')
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); addTag() }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }

    setIsLoading(true)
    setError('')

    try {
      const payload: CreateEntryRequest = {
        title:      title.trim(),
        content:    content.trim() || undefined,
        entryType,
        entryDate:  toDateKey(date),
        mood:       mood ? parseInt(mood) : undefined,
        tags:       tags.length > 0 ? tags : undefined,
        startTime:  entryType === 'EVENT' && startTime ? startTime : undefined,
        endTime:    entryType === 'EVENT' && endTime   ? endTime   : undefined,
        isCompleted: entryType === 'ACTION' ? false : undefined,
      }

      if (isEditing && entry) {
        const updated = await entriesApi.update(entry.id, payload)
        updateEntry(updated)
      } else {
        const created = await entriesApi.create(payload)
        addEntry(created)
      }
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 animate-fade-in">
      {/* Type selector */}
      <div className="flex gap-2">
        {(Object.entries(ENTRY_TYPE_META) as [EntryType, typeof ENTRY_TYPE_META[EntryType]][]).map(([type, meta]) => (
          <button
            key={type}
            type="button"
            onClick={() => setEntryType(type)}
            className={`flex-1 py-2 px-3 rounded-md text-xs font-mono border transition-all duration-150 ${
              entryType === type
                ? 'border-transparent text-bg font-medium'
                : 'border-border text-secondary hover:border-accent/30'
            }`}
            style={entryType === type ? { backgroundColor: meta.color } : {}}
          >
            {meta.icon} {meta.label}
          </button>
        ))}
      </div>

      {/* Title */}
      <Input
        label="Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder={`What did you ${entryType === 'SKILL' ? 'learn' : entryType === 'ACTION' ? 'do' : 'note'}?`}
        autoFocus
      />

      {/* Content */}
      <Textarea
        label="Details"
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Add more detail..."
        rows={4}
      />

      {/* Event time fields */}
      {entryType === 'EVENT' && (
        <div className="flex gap-3">
          <Input
            label="Start time"
            type="time"
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
            className="flex-1"
          />
          <Input
            label="End time"
            type="time"
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
            className="flex-1"
          />
        </div>
      )}

      {/* Mood */}
      <Select
        label="Mood"
        value={mood}
        onChange={e => setMood(e.target.value)}
        options={MOOD_OPTIONS}
      />

      {/* Tags */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-body font-medium text-secondary uppercase tracking-widest">
          Tags
        </label>
        <div className="flex flex-wrap gap-1.5 p-2 bg-surface border border-border rounded-md min-h-[38px]">
          {tags.map(t => (
            <TagBadge
              key={t}
              tag={{ id: 0, name: t, color: '#818cf8' }}
              onRemove={() => setTags(tags.filter(x => x !== t))}
            />
          ))}
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={addTag}
            placeholder={tags.length === 0 ? 'Add tags...' : ''}
            className="flex-1 min-w-[80px] bg-transparent text-xs text-primary font-mono outline-none placeholder:text-muted"
          />
        </div>
      </div>

      {/* Error */}
      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={isLoading} className="flex-1">
          {isEditing ? 'Save changes' : 'Add entry'}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  )
}