import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function SignUp() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', phoneNumber: '', email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signUp(form)
      navigate('/pick-faculty')
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-6 py-16">
      <div className="w-full max-w-[420px] bg-white border border-line rounded-lg p-8">
        <div className="font-mono text-xs tracking-wider text-flame uppercase mb-3 font-medium">
          Create account
        </div>
        <h1 className="font-display text-2xl font-semibold mb-6">Start free with FirstClass</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Username" value={form.username} onChange={update('username')} required />
          <Field
            label="Phone number"
            type="tel"
            value={form.phoneNumber}
            onChange={update('phoneNumber')}
            required
            hint="You'll log in with this number"
          />
          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={update('email')}
            hint="Optional — for account recovery only"
          />
          <Field
            label="Password"
            type="password"
            value={form.password}
            onChange={update('password')}
            required
          />

          {error && <div className="text-rose text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cobalt text-white py-3 rounded font-medium text-sm disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Field({ label, hint, ...inputProps }) {
  return (
    <label className="block">
      <span className="text-[13px] font-medium text-graphite/80">{label}</span>
      <input
        {...inputProps}
        className="mt-1.5 w-full border border-line rounded px-3.5 py-2.5 text-sm focus:outline-none focus:border-cobalt"
      />
      {hint && <span className="block text-[11.5px] text-graphite/50 mt-1">{hint}</span>}
    </label>
  )
}
