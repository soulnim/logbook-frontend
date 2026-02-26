// ── Entry Types ───────────────────────────────────────────────────────────────

export type EntryType = 'NOTE' | 'SKILL' | 'ACTION' | 'EVENT'

export interface Tag {
  id: number
  name: string
  color: string
}

export interface Entry {
  id: number
  title: string
  content: string | null
  entryType: EntryType
  entryDate: string       // "YYYY-MM-DD"
  startTime: string | null
  endTime: string | null
  isCompleted: boolean
  mood: number | null     // 1-5
  tags: Tag[]
  createdAt: string
  updatedAt: string
}

export interface CreateEntryRequest {
  title: string
  content?: string
  entryType: EntryType
  entryDate: string
  startTime?: string
  endTime?: string
  isCompleted?: boolean
  mood?: number
  tags?: string[]
}

export interface UpdateEntryRequest {
  title?: string
  content?: string
  entryDate?: string
  startTime?: string
  endTime?: string
  isCompleted?: boolean
  mood?: number
  tags?: string[]
}

// ── Stats / Heatmap ───────────────────────────────────────────────────────────

export interface HeatmapDay {
  date: string   // "YYYY-MM-DD"
  count: number
  level: number  // 0-4
}

export interface HeatmapData {
  data: HeatmapDay[]
  totalEntries: number
  activeDays: number
  currentStreak: number
  longestStreak: number
}

export interface StatsData {
  totalEntries: number
  activeDays: number
  currentStreak: number
  longestStreak: number
  byType: Record<EntryType, number>
  recentEntries: Entry[]
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface User {
  id: number
  email: string
  name: string
  avatarUrl: string
  createdAt: string
}

// ── UI Helpers ────────────────────────────────────────────────────────────────

// Static meta — colors come from CSS variables via Tailwind (var(--color-note) etc.)
// For inline styles we still need hex values; these are close enough for both themes
export const ENTRY_TYPE_META: Record<EntryType, { label: string; color: string; bg: string; icon: string }> = {
  NOTE:   { label: 'Note',   color: 'var(--color-note)',   bg: 'color-mix(in srgb, var(--color-note) 12%, transparent)',   icon: '📝' },
  SKILL:  { label: 'Skill',  color: 'var(--color-skill)',  bg: 'color-mix(in srgb, var(--color-skill) 12%, transparent)',  icon: '🧠' },
  ACTION: { label: 'Action', color: 'var(--color-action)', bg: 'color-mix(in srgb, var(--color-action) 12%, transparent)', icon: '⚡' },
  EVENT:  { label: 'Event',  color: 'var(--color-event)',  bg: 'color-mix(in srgb, var(--color-event) 12%, transparent)',  icon: '📅' },
}

export const MOOD_LABELS: Record<number, string> = {
  1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😄',
}