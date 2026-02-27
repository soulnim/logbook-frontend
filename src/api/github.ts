import { client } from './client'
import type { GitHubStatus, WatchedRepo, RepoListItem } from '../types'

export const githubApi = {
  // Status
  getStatus: () =>
    client.get<GitHubStatus>('/api/github/status').then(r => r.data),

  // OAuth
  getAuthorizeUrl: () =>
    client.get<{ url: string; state: string }>('/api/github/oauth/authorize').then(r => r.data),

  disconnect: () =>
    client.delete('/api/github/connection'),

  // Preferences
  applyPreferences: (syncOldCommits: boolean) =>
    client.post('/api/github/preferences', { syncOldCommits }),

  toggleSync: (enabled: boolean) =>
    client.patch('/api/github/sync', { enabled }),

  // Repos
  listRepos: () =>
    client.get<RepoListItem[]>('/api/github/repos').then(r => r.data),

  watchRepo: (repoFullName: string, repoName: string) =>
    client.post<WatchedRepo>('/api/github/repos/watch', { repoFullName, repoName }).then(r => r.data),

  unwatchRepo: (repoId: number) =>
    client.delete(`/api/github/repos/${repoId}`),
}