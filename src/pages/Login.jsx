import React, { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { friendlyAuthError } from '../lib/authErrors.js'

export default function Login() {
  const { user, logIn } = useAuth()
  const navigate = useNavigate()
  const from = useLocation().state?.from || '/'
  const [form, setForm] = useState({ phoneNumber: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to={from} replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await logIn(form)
      navigate(from, { replace: true })
    } catch (err) {
      setError(friendlyAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-paper px-6 py-16">
      <div className="w-full max-w-[420px] bg-white border border-line rounded-lg p-8">
        <div className="font-mono text-xs tracking-wider text-flame uppercase mb-3 font-medium">Log in</div>
        <h1 className="font-display text-2xl font-semibold mb-6">Welcome back</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-[13px] font-medium text-graphite/80">Phone number</span>
            <input
              type="tel"
              required
              autoComplete="tel"
              value={form.phoneNumber}
              onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
              className="mt-1.5 w-full border border-line rounded px-3.5 py-2.5 text-sm focus:outline-none focus:border-cobalt"
            />
          </label>
          <label className="block">
            <span className="text-[13px] font-medium text-graphite/80">Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="mt-1.5 w-full border border-line rounded px-3.5 py-2.5 text-sm focus:outline-none focus:border-cobalt"
            />
          </label>
          {error && <div className="text-rose text-sm">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cobalt text-white py-3 rounded font-medium text-sm disabled:opacity-60"
          >
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>
        <p className="text-sm text-graphite/60 mt-6 text-center">
          New here? <Link to="/signup" className="text-cobalt font-medium">Create an account</Link>
        </p>
      </div>
    </div>
  )
}
