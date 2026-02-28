import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Sun, Moon, Clock } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import { githubApi } from '../api/github'
import type { GitHubStatus, RepoListItem } from '../types'

export function SettingsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, logout, updateTimezone } = useAuthStore()
  const { theme, setTheme } = useThemeStore()

  const [githubStatus, setGithubStatus] = useState<GitHubStatus | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [repos, setRepos] = useState<RepoListItem[]>([])
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [showRepos, setShowRepos] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Timezone state
  const [tzSearch, setTzSearch] = useState('')
  const [tzSaving, setTzSaving] = useState(false)

  // Preference modal state
  const [showPrefModal, setShowPrefModal] = useState(false)
  const [syncOldCommits, setSyncOldCommits] = useState(false)

  useEffect(() => {
    loadStatus()

    // Handle redirect back from GitHub OAuth
    const ghResult = searchParams.get('github')
    if (ghResult === 'connected') {
      setShowPrefModal(true)
      window.history.replaceState({}, '', '/settings')
    } else if (ghResult === 'error') {
      showToast('GitHub connection failed. Please try again.')
      window.history.replaceState({}, '', '/settings')
    }
  }, [])

  const loadStatus = async () => {
    try {
      const status = await githubApi.getStatus()
      setGithubStatus(status)
    } catch {
      // not connected yet is fine
    } finally {
      setLoadingStatus(false)
    }
  }

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const { url } = await githubApi.getAuthorizeUrl()
      window.location.href = url
    } catch {
      showToast('Failed to start GitHub connection.')
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Disconnect GitHub? This will stop syncing new commits. Existing entries will not be deleted.')) return
    try {
      await githubApi.disconnect()
      setGithubStatus(prev => prev ? { ...prev, connected: false, githubUsername: null, watchedRepos: [] } : null)
      showToast('GitHub disconnected.')
    } catch {
      showToast('Failed to disconnect GitHub.')
    }
  }

  const handleApplyPreference = async () => {
    try {
      await githubApi.applyPreferences(syncOldCommits)
      setShowPrefModal(false)
      await loadStatus()
      setShowRepos(true)
      await loadRepos()
      showToast('GitHub connected! Now select repos to watch.')
    } catch {
      showToast('Failed to save preferences.')
    }
  }

  const handleToggleSync = async (enabled: boolean) => {
    try {
      await githubApi.toggleSync(enabled)
      setGithubStatus(prev => prev ? { ...prev, syncEnabled: enabled } : null)
      showToast(enabled ? 'Sync resumed.' : 'Sync paused.')
    } catch {
      showToast('Failed to update sync setting.')
    }
  }

  const loadRepos = async () => {
    setLoadingRepos(true)
    try {
      const list = await githubApi.listRepos()
      setRepos(list)
    } catch {
      showToast('Failed to load repositories.')
    } finally {
      setLoadingRepos(false)
    }
  }

  const handleWatchRepo = async (repo: RepoListItem) => {
    try {
      const watched = await githubApi.watchRepo(repo.fullName, repo.name)
      setGithubStatus(prev => prev ? {
        ...prev,
        watchedRepos: [...prev.watchedRepos, watched]
      } : null)
      setRepos(prev => prev.map(r => r.fullName === repo.fullName ? { ...r, alreadyWatched: true } : r))
      showToast(`Now watching ${repo.name}`)
    } catch {
      showToast('Failed to watch repo.')
    }
  }

  const handleUnwatchRepo = async (repoId: number, repoName: string) => {
    try {
      await githubApi.unwatchRepo(repoId)
      setGithubStatus(prev => prev ? {
        ...prev,
        watchedRepos: prev.watchedRepos.filter(r => r.id !== repoId)
      } : null)
      setRepos(prev => prev.map(r => r.name === repoName ? { ...r, alreadyWatched: false } : r))
      showToast(`Stopped watching ${repoName}`)
    } catch {
      showToast('Failed to unwatch repo.')
    }
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // Common IANA timezones grouped for the dropdown
  const TIMEZONES = [
    // UTC
    { value: 'UTC',                      label: 'UTC — Coordinated Universal Time' },
    // Americas
    { value: 'America/New_York',         label: 'America/New_York (EST/EDT, UTC-5/4)' },
    { value: 'America/Chicago',          label: 'America/Chicago (CST/CDT, UTC-6/5)' },
    { value: 'America/Denver',           label: 'America/Denver (MST/MDT, UTC-7/6)' },
    { value: 'America/Los_Angeles',      label: 'America/Los_Angeles (PST/PDT, UTC-8/7)' },
    { value: 'America/Anchorage',        label: 'America/Anchorage (AKST/AKDT, UTC-9/8)' },
    { value: 'America/Sao_Paulo',        label: 'America/Sao_Paulo (BRT, UTC-3)' },
    { value: 'America/Argentina/Buenos_Aires', label: 'America/Buenos_Aires (ART, UTC-3)' },
    { value: 'America/Toronto',          label: 'America/Toronto (EST/EDT, UTC-5/4)' },
    { value: 'America/Vancouver',        label: 'America/Vancouver (PST/PDT, UTC-8/7)' },
    { value: 'America/Mexico_City',      label: 'America/Mexico_City (CST/CDT, UTC-6/5)' },
    // Europe
    { value: 'Europe/London',            label: 'Europe/London (GMT/BST, UTC+0/1)' },
    { value: 'Europe/Paris',             label: 'Europe/Paris (CET/CEST, UTC+1/2)' },
    { value: 'Europe/Berlin',            label: 'Europe/Berlin (CET/CEST, UTC+1/2)' },
    { value: 'Europe/Madrid',            label: 'Europe/Madrid (CET/CEST, UTC+1/2)' },
    { value: 'Europe/Rome',              label: 'Europe/Rome (CET/CEST, UTC+1/2)' },
    { value: 'Europe/Amsterdam',         label: 'Europe/Amsterdam (CET/CEST, UTC+1/2)' },
    { value: 'Europe/Moscow',            label: 'Europe/Moscow (MSK, UTC+3)' },
    { value: 'Europe/Istanbul',          label: 'Europe/Istanbul (TRT, UTC+3)' },
    { value: 'Europe/Warsaw',            label: 'Europe/Warsaw (CET/CEST, UTC+1/2)' },
    { value: 'Europe/Stockholm',         label: 'Europe/Stockholm (CET/CEST, UTC+1/2)' },
    // Africa
    { value: 'Africa/Cairo',             label: 'Africa/Cairo (EET, UTC+2)' },
    { value: 'Africa/Johannesburg',      label: 'Africa/Johannesburg (SAST, UTC+2)' },
    { value: 'Africa/Lagos',             label: 'Africa/Lagos (WAT, UTC+1)' },
    { value: 'Africa/Nairobi',           label: 'Africa/Nairobi (EAT, UTC+3)' },
    // Middle East
    { value: 'Asia/Dubai',               label: 'Asia/Dubai (GST, UTC+4)' },
    { value: 'Asia/Riyadh',              label: 'Asia/Riyadh (AST, UTC+3)' },
    { value: 'Asia/Tehran',              label: 'Asia/Tehran (IRST/IRDT, UTC+3:30/4:30)' },
    { value: 'Asia/Baghdad',             label: 'Asia/Baghdad (AST, UTC+3)' },
    // Asia
    { value: 'Asia/Kolkata',             label: 'Asia/Kolkata (IST, UTC+5:30)' },
    { value: 'Asia/Karachi',             label: 'Asia/Karachi (PKT, UTC+5)' },
    { value: 'Asia/Dhaka',               label: 'Asia/Dhaka (BST, UTC+6)' },
    { value: 'Asia/Yangon',              label: 'Asia/Yangon (MMT, UTC+6:30)' },
    { value: 'Asia/Bangkok',             label: 'Asia/Bangkok (ICT, UTC+7)' },
    { value: 'Asia/Jakarta',             label: 'Asia/Jakarta (WIB, UTC+7)' },
    { value: 'Asia/Ho_Chi_Minh',         label: 'Asia/Ho_Chi_Minh (ICT, UTC+7)' },
    { value: 'Asia/Kuala_Lumpur',        label: 'Asia/Kuala_Lumpur (MYT, UTC+8)' },
    { value: 'Asia/Singapore',           label: 'Asia/Singapore (SGT, UTC+8)' },
    { value: 'Asia/Manila',              label: 'Asia/Manila (PST, UTC+8)' },
    { value: 'Asia/Shanghai',            label: 'Asia/Shanghai (CST, UTC+8)' },
    { value: 'Asia/Hong_Kong',           label: 'Asia/Hong_Kong (HKT, UTC+8)' },
    { value: 'Asia/Taipei',              label: 'Asia/Taipei (CST, UTC+8)' },
    { value: 'Asia/Tokyo',               label: 'Asia/Tokyo (JST, UTC+9)' },
    { value: 'Asia/Seoul',               label: 'Asia/Seoul (KST, UTC+9)' },
    // Pacific / Oceania
    { value: 'Australia/Sydney',         label: 'Australia/Sydney (AEST/AEDT, UTC+10/11)' },
    { value: 'Australia/Melbourne',      label: 'Australia/Melbourne (AEST/AEDT, UTC+10/11)' },
    { value: 'Australia/Brisbane',       label: 'Australia/Brisbane (AEST, UTC+10)' },
    { value: 'Australia/Perth',          label: 'Australia/Perth (AWST, UTC+8)' },
    { value: 'Pacific/Auckland',         label: 'Pacific/Auckland (NZST/NZDT, UTC+12/13)' },
    { value: 'Pacific/Honolulu',         label: 'Pacific/Honolulu (HST, UTC-10)' },
  ]

  const filteredTz = tzSearch.trim()
    ? TIMEZONES.filter(tz =>
        tz.label.toLowerCase().includes(tzSearch.toLowerCase()) ||
        tz.value.toLowerCase().includes(tzSearch.toLowerCase())
      )
    : TIMEZONES

  const handleTimezoneChange = async (newTz: string) => {
    setTzSaving(true)
    try {
      await updateTimezone(newTz)
      showToast('Timezone updated.')
    } catch {
      showToast('Failed to update timezone.')
    } finally {
      setTzSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Topbar */}
      <header className="bg-surface border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted hover:text-text transition-colors">
            <span className="text-lg">←</span>
            <span className="font-mono text-sm">Back</span>
          </button>
          <div className="w-px h-5 bg-border" />
          <span className="font-mono text-sm text-text font-semibold">Settings</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">

        {/* Profile section */}
        <section>
          <h2 className="text-xs font-mono text-muted uppercase tracking-widest mb-4">Account</h2>
          <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
            {user?.avatarUrl && (
              <img src={user.avatarUrl} alt="avatar" className="w-12 h-12 rounded-full" />
            )}
            <div>
              <p className="text-text font-semibold">{user?.name}</p>
              <p className="text-muted text-sm">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="ml-auto text-sm text-muted hover:text-red-400 transition-colors font-mono"
            >
              Sign out
            </button>
          </div>
        </section>

        {/* Appearance */}
        <section>
          <h2 className="text-xs font-mono text-muted uppercase tracking-widest mb-4">Appearance</h2>
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-sm font-medium text-text mb-4">Theme</p>
            <div className="flex gap-3">
              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-3 rounded-lg border text-sm font-mono transition-all ${
                  theme === 'dark'
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-muted hover:text-text hover:bg-surface'
                }`}
              >
                <Moon size={15} />
                Dark
              </button>
              <button
                onClick={() => setTheme('light')}
                className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-3 rounded-lg border text-sm font-mono transition-all ${
                  theme === 'light'
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-muted hover:text-text hover:bg-surface'
                }`}
              >
                <Sun size={15} />
                Light
              </button>
            </div>
          </div>
        </section>

        {/* Timezone */}
        <section>
          <h2 className="text-xs font-mono text-muted uppercase tracking-widest mb-4">
            Timezone
          </h2>
          <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <Clock size={16} className="text-accent mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-text">Calendar date timezone</p>
                <p className="text-xs text-muted mt-0.5">
                  Used to stamp goal and milestone completions on the correct calendar day.
                  {user?.timezone
                    ? <> Currently set to <span className="text-accent font-mono">{user.timezone}</span>.</>
                    : <> Not set yet — will be auto-detected on next page load.</>
                  }
                </p>
              </div>
            </div>

            {/* Search */}
            <input
              type="text"
              value={tzSearch}
              onChange={e => setTzSearch(e.target.value)}
              placeholder="Search timezone or city..."
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-accent/40 font-mono"
            />

            {/* Timezone list */}
            <div className="border border-border rounded-lg overflow-hidden max-h-52 overflow-y-auto">
              {filteredTz.length === 0 ? (
                <p className="text-center text-xs text-muted py-6">No timezones match your search.</p>
              ) : (
                <div className="divide-y divide-border">
                  {filteredTz.map(tz => (
                    <button
                      key={tz.value}
                      onClick={() => handleTimezoneChange(tz.value)}
                      disabled={tzSaving}
                      className={`w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center justify-between gap-2 ${
                        user?.timezone === tz.value
                          ? 'bg-accent/10 text-accent font-medium'
                          : 'text-secondary hover:bg-surface hover:text-primary'
                      }`}
                    >
                      <span className="font-mono text-xs">{tz.value}</span>
                      <span className="text-xs text-muted truncate text-right flex-1">
                        {tz.label.split(' — ')[1] ?? tz.label.split(' (')[1]?.replace(')', '') ?? ''}
                      </span>
                      {user?.timezone === tz.value && (
                        <span className="text-accent text-xs shrink-0">✓ Active</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {tzSaving && (
              <p className="text-xs text-muted font-mono animate-pulse">Saving...</p>
            )}
          </div>
        </section>

        {/* GitHub Integration */}
        <section>
          <h2 className="text-xs font-mono text-muted uppercase tracking-widest mb-4">Integrations</h2>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-5 flex items-start gap-4">
              <div className="w-10 h-10 bg-surface rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-text">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-text font-semibold">GitHub</h3>
                  {githubStatus?.connected && (
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono">
                      Connected
                    </span>
                  )}
                </div>
                <p className="text-muted text-sm mt-1">
                  Auto-create a Logbook entry whenever you push commits to a watched repo.
                </p>

                {githubStatus?.connected && githubStatus.githubUsername && (
                  <p className="text-xs text-muted mt-1 font-mono">
                    @{githubStatus.githubUsername}
                  </p>
                )}
              </div>
            </div>

            {/* Connected state */}
            {githubStatus?.connected ? (
              <div className="border-t border-border">
                {/* Sync toggle */}
                <div className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text font-medium">Sync commits</p>
                    <p className="text-xs text-muted mt-0.5">
                      {githubStatus.syncEnabled ? 'New commits are being synced' : 'Sync is paused'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleSync(!githubStatus.syncEnabled)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      githubStatus.syncEnabled ? 'bg-accent' : 'bg-border'
                    }`}
                  >
                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${
                      githubStatus.syncEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Watched repos */}
                <div className="px-5 py-4 border-t border-border">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-text font-medium">
                      Watched repos ({githubStatus.watchedRepos.length})
                    </p>
                    <button
                      onClick={async () => {
                        if (!showRepos) { await loadRepos() }
                        setShowRepos(v => !v)
                      }}
                      className="text-xs text-accent hover:text-accent/80 font-mono transition-colors"
                    >
                      {showRepos ? 'Hide' : '+ Add repos'}
                    </button>
                  </div>

                  {/* Currently watched */}
                  {githubStatus.watchedRepos.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {githubStatus.watchedRepos.map(repo => (
                        <div key={repo.id} className="flex items-center justify-between bg-surface rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-emerald-400">●</span>
                            <span className="text-sm text-text font-mono">{repo.repoFullName}</span>
                          </div>
                          <button
                            onClick={() => handleUnwatchRepo(repo.id, repo.repoName)}
                            className="text-xs text-muted hover:text-red-400 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {githubStatus.watchedRepos.length === 0 && !showRepos && (
                    <p className="text-xs text-muted">No repos watched yet. Add one above.</p>
                  )}

                  {/* Repo picker */}
                  {showRepos && (
                    <div className="mt-3 border border-border rounded-lg overflow-hidden">
                      {loadingRepos ? (
                        <div className="p-4 text-center text-muted text-sm">Loading repos…</div>
                      ) : (
                        <div className="divide-y divide-border max-h-64 overflow-y-auto">
                          {repos.map(repo => (
                            <div key={repo.fullName} className="flex items-center justify-between px-3 py-2.5 hover:bg-surface transition-colors">
                              <div>
                                <p className="text-sm text-text font-mono">{repo.fullName}</p>
                                {repo.description && (
                                  <p className="text-xs text-muted mt-0.5 truncate max-w-xs">{repo.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                {repo.isPrivate && (
                                  <span className="text-xs text-muted bg-border px-1.5 py-0.5 rounded">private</span>
                                )}
                                {repo.alreadyWatched ? (
                                  <span className="text-xs text-emerald-400 font-mono">watching</span>
                                ) : (
                                  <button
                                    onClick={() => handleWatchRepo(repo)}
                                    className="text-xs bg-accent/20 text-accent hover:bg-accent/30 px-2.5 py-1 rounded font-mono transition-colors"
                                  >
                                    Watch
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Disconnect */}
                <div className="px-5 py-4 border-t border-border">
                  <button
                    onClick={handleDisconnect}
                    className="text-sm text-red-400 hover:text-red-300 transition-colors font-mono"
                  >
                    Disconnect GitHub
                  </button>
                </div>
              </div>
            ) : (
              /* Not connected state */
              <div className="px-5 pb-5">
                <button
                  onClick={handleConnect}
                  disabled={connecting || loadingStatus}
                  className="w-full bg-surface hover:bg-border border border-border rounded-lg py-2.5 text-sm text-text font-mono transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {connecting ? (
                    <span className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                    </svg>
                  )}
                  Connect GitHub
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Preference modal — shown after GitHub OAuth callback */}
      {showPrefModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🎉</span>
              <h3 className="text-text font-semibold text-lg">GitHub connected!</h3>
            </div>
            <p className="text-muted text-sm mb-6">
              One quick preference before you start watching repos:
            </p>

            <div className="space-y-3 mb-6">
              <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                !syncOldCommits ? 'border-accent bg-accent/10' : 'border-border hover:bg-surface'
              }`}>
                <input
                  type="radio"
                  name="syncPref"
                  checked={!syncOldCommits}
                  onChange={() => setSyncOldCommits(false)}
                  className="mt-0.5 accent-[var(--color-accent)]"
                />
                <div>
                  <p className="text-sm text-text font-medium">Start fresh</p>
                  <p className="text-xs text-muted mt-0.5">Only sync commits from now onwards.</p>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                syncOldCommits ? 'border-accent bg-accent/10' : 'border-border hover:bg-surface'
              }`}>
                <input
                  type="radio"
                  name="syncPref"
                  checked={syncOldCommits}
                  onChange={() => setSyncOldCommits(true)}
                  className="mt-0.5 accent-[var(--color-accent)]"
                />
                <div>
                  <p className="text-sm text-text font-medium">Import past commits</p>
                  <p className="text-xs text-muted mt-0.5">Sync commits from the last 90 days for watched repos.</p>
                </div>
              </label>
            </div>

            <button
              onClick={handleApplyPreference}
              className="w-full bg-accent hover:bg-accent/90 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-text shadow-xl font-mono">
          {toast}
        </div>
      )}
    </div>
  )
}