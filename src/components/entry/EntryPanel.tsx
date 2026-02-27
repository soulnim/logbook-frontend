import { useState } from 'react'
import { X, Plus, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { useEntryStore } from '../../store/entryStore'
import { EntryCard } from './EntryCard'
import { EntryForm } from './EntryForm'
import { toDateKey } from '../../utils/dateUtils'
import type { Entry } from '../../types'

export function EntryPanel() {
  const { selectedDate, isPanelOpen, closePanel, entriesByDate } = useEntryStore()
  const [showForm, setShowForm]   = useState(false)
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null)

  const dateKey = selectedDate ? toDateKey(selectedDate) : null
  const entries = dateKey ? (entriesByDate[dateKey] || []) : []

  const handleEdit = (entry: Entry) => {
    setEditingEntry(entry)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingEntry(null)
  }

  const handleNewEntry = () => {
    setEditingEntry(null)
    setShowForm(true)
  }

  if (!isPanelOpen || !selectedDate) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-x-0 bottom-0 top-14 z-20 bg-bg/60 backdrop-blur-sm"
        onClick={closePanel}
      />

      {/* Panel */}
      <div className="fixed right-0 top-14 bottom-0 z-30 w-full max-w-md bg-surface border-l border-border flex flex-col animate-slide-in shadow-2xl">
        {/* Panel header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-accent" />
              <h3 className="text-sm font-mono text-accent">
                {format(selectedDate, 'EEEE')}
              </h3>
            </div>
            <p className="text-xl font-display font-semibold text-primary mt-0.5">
              {format(selectedDate, 'MMMM d, yyyy')}
            </p>
          </div>
          <button
            onClick={closePanel}
            className="w-8 h-8 flex items-center justify-center rounded-md text-secondary hover:text-primary hover:bg-hover transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Panel body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4 min-h-0">

          {/* Form */}
          {showForm ? (
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-display font-semibold text-primary">
                  {editingEntry ? 'Edit entry' : 'New entry'}
                </h4>
                <button
                  onClick={handleCloseForm}
                  className="text-muted hover:text-secondary transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              <EntryForm
                date={selectedDate}
                entry={editingEntry}
                onClose={handleCloseForm}
              />
            </div>
          ) : (
            <button
              onClick={handleNewEntry}
              className="w-full flex items-center gap-2 justify-center py-2.5 rounded-lg border border-dashed border-border text-secondary hover:border-accent/40 hover:text-accent transition-all duration-150 text-sm font-body"
            >
              <Plus size={14} />
              Add entry
            </button>
          )}

          {/* Entries list */}
          {entries.length > 0 ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-mono text-muted uppercase tracking-widest">
                {entries.length} entr{entries.length === 1 ? 'y' : 'ies'}
              </p>
              {entries.map(entry => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onEdit={() => handleEdit(entry)}
                />
              ))}
            </div>
          ) : (
            !showForm && (
              <div className="flex flex-col items-center justify-center flex-1 text-center py-12">
                <div className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center mb-3">
                  <Calendar size={20} className="text-muted" />
                </div>
                <p className="text-sm text-secondary font-body">Nothing logged yet</p>
                <p className="text-xs text-muted font-body mt-1">Click above to make your first commit</p>
              </div>
            )
          )}
        </div>
      </div>
    </>
  )
}