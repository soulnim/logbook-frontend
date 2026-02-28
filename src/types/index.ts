// ── Entry Types ───────────────────────────────────────────────────────────────

export type EntryType = 'NOTE' | 'SKILL' | 'ACTION' | 'EVENT' | 'COMMIT'

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
  sourceMeta: string | null  // JSON string for COMMIT entries
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

// ── GitHub ────────────────────────────────────────────────────────────────────

export interface GitHubCommit {
  sha: string
  message: string
  url: string
  timestamp: string
  authorName: string
}

export interface GitHubSourceMeta {
  repoFullName: string
  repoName: string
  branch: string
  commits: GitHubCommit[]
}

export interface GitHubStatus {
  connected: boolean
  githubUsername: string | null
  syncEnabled: boolean
  syncFrom: string | null
  watchedRepos: WatchedRepo[]
}

export interface WatchedRepo {
  id: number
  repoFullName: string
  repoName: string
  isActive: boolean
}

export interface RepoListItem {
  fullName: string
  name: string
  isPrivate: boolean
  description: string | null
  alreadyWatched: boolean
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

// ── Goals & Milestones ────────────────────────────────────────────────────────

export type GoalType   = 'PERSONAL' | 'PROJECT' | 'LEARNING' | 'HABIT' | 'OTHER'
export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'

export interface Milestone {
  id: number
  title: string
  isCompleted: boolean
  completedAt: string | null
  displayOrder: number
  createdAt: string
}

export interface Goal {
  id: number
  title: string
  description: string | null
  type: GoalType
  status: GoalStatus
  color: string
  targetDate: string | null   // "YYYY-MM-DD"
  milestones: Milestone[]
  totalMilestones: number
  completedMilestones: number
  progressPercent: number     // 0-100
  overdue: boolean
  daysUntilDeadline: number   // negative = overdue, MAX_VALUE = no deadline
  createdAt: string
  updatedAt: string
}

export interface CreateGoalRequest {
  title: string
  description?: string
  type: GoalType
  color?: string
  targetDate?: string
}

export interface UpdateGoalRequest {
  title?: string
  description?: string
  type?: GoalType
  color?: string
  targetDate?: string
}

export interface CreateMilestoneRequest {
  title: string
  displayOrder?: number
}

export interface UpdateMilestoneRequest {
  title?: string
  isCompleted?: boolean
  displayOrder?: number
}

export interface GoalSummary {
  activeCount: number
  completedCount: number
  overdueCount: number
}

export const GOAL_TYPE_META: Record<GoalType, { label: string; icon: string; color: string }> = {
  PERSONAL: { label: 'Personal', icon: '🌱', color: '#34d399' },
  PROJECT:  { label: 'Project',  icon: '🚀', color: '#818cf8' },
  LEARNING: { label: 'Learning', icon: '🧠', color: '#38bdf8' },
  HABIT:    { label: 'Habit',    icon: '🔄', color: '#f59e0b' },
  OTHER:    { label: 'Other',    icon: '📌', color: '#94a3b8' },
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

export const ENTRY_TYPE_META: Record<EntryType, { label: string; color: string; bg: string; icon: string }> = {
  NOTE:   { label: 'Note',   color: '#818cf8', bg: 'rgba(129,140,248,0.12)', icon: '📝' },
  SKILL:  { label: 'Skill',  color: '#34d399', bg: 'rgba(52,211,153,0.12)',  icon: '🧠' },
  ACTION: { label: 'Action', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: '⚡' },
  EVENT:  { label: 'Event',  color: '#f472b6', bg: 'rgba(244,114,182,0.12)', icon: '📅' },
  COMMIT: { label: 'Commit', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',  icon: '🔀' },
}

export const MOOD_LABELS: Record<number, string> = {
  1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😄',
}