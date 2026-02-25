import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export function AuthCallbackPage() {
  const [params] = useSearchParams()
  const navigate  = useNavigate()
  const { setToken, loadUser } = useAuthStore()

  useEffect(() => {
    const token = params.get('token')
    if (!token) { navigate('/login'); return }

    setToken(token)
    loadUser().then(() => navigate('/'))
  }, [])

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        <p className="text-sm text-secondary font-body">Signing you in...</p>
      </div>
    </div>
  )
}