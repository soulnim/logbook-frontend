import { authApi } from '../api/auth'
import { useAuthStore } from '../store/authStore'

export function LoginPage() {
  const { previousUsers } = useAuthStore()

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4">
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(#818cf8 1px, transparent 1px),
            linear-gradient(90deg, #818cf8 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-xl bg-card border border-border flex items-center justify-center mb-4 shadow-lg">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="2" width="18" height="24" rx="2" stroke="#818cf8" strokeWidth="1.5"/>
              <line x1="8" y1="8"  x2="18" y2="8"  stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="8" y1="12" x2="15" y2="12" stroke="#44445a" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="8" y1="16" x2="17" y2="16" stroke="#44445a" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="24" cy="24" r="7" fill="#3dd68c"/>
              <line x1="21" y1="24" x2="27" y2="24" stroke="#08080f" strokeWidth="2" strokeLinecap="round"/>
              <line x1="24" y1="21" x2="24" y2="27" stroke="#08080f" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-3xl font-display font-bold text-primary tracking-tight">Logbook</h1>
          <p className="text-sm text-secondary font-body mt-2 text-center">
            Your personal daily commit tracker
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-xl space-y-6">
          <div>
            <p className="text-center text-sm text-secondary font-body">
              Sign in or sign up with your Google account
            </p>
          </div>

          <button
            onClick={() => authApi.loginWithGoogle()}
            className="w-full flex items-center justify-center gap-3 bg-surface hover:bg-hover border border-border rounded-lg px-4 py-3 text-sm font-body text-primary transition-all duration-150 hover:border-accent/30 active:scale-[0.98] group"
          >
            {/* Google icon */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          {previousUsers.length > 0 && (
            <div className="pt-4 border-t border-border/70 space-y-3">
              <p className="text-xs text-secondary font-body">
                Continue as
              </p>
              <div className="flex flex-col gap-2">
                {previousUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => authApi.loginWithGoogle()}
                    className="w-full flex items-center gap-3 bg-surface hover:bg-hover border border-border rounded-lg px-3 py-2 text-sm font-body text-primary transition-colors"
                  >
                    {u.avatarUrl && (
                      <img
                        src={u.avatarUrl}
                        alt={u.name}
                        className="w-7 h-7 rounded-full border border-border"
                      />
                    )}
                    <div className="flex flex-col items-start">
                      <span className="text-sm text-primary">{u.name}</span>
                      <span className="text-xs text-muted">{u.email}</span>
                    </div>
                    <span className="ml-auto text-xs text-accent font-mono">
                      Continue →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted font-body mt-6">
          Your entries are private and only visible to you
        </p>
      </div>
    </div>
  )
}