import type { Tag } from '../../types'

interface TagBadgeProps {
  tag: Tag
  onRemove?: () => void
}

export function TagBadge({ tag, onRemove }: TagBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono"
      style={{
        color: tag.color,
        backgroundColor: `${tag.color}18`,
        border: `1px solid ${tag.color}30`,
      }}
    >
      {tag.name}
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:opacity-70 transition-opacity ml-0.5"
        >
          ×
        </button>
      )}
    </span>
  )
}