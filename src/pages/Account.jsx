import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { friendlyAuthError } from '../lib/authErrors.js'

const seam = () => (import.meta.env.VITE_E2E && window.__FC_TEST__ && window.__FC_TEST__.changePassword) || null

async function changePassword(user, current, next) {
  const s = seam()
  if (s) return s(current, next)
  const fbUser = auth.currentUser
  const cred = EmailAuthProvider.credential(fbUser.email, current)
  await reauthenticateWithCredential(fbUser, cred) // proves it is really the student, not someone on a borrowed phone
  await updatePassword(fbUser, next)
  await setDoc(doc(db, 'users', user.uid), { mustChangePassword: false }, { merge: true })
}

export default function Account() {
  const { user, profile, refreshProfile, logOut } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ current: '', next: '', again: '' })
  const [state, setState] = useState({ busy: false, error: null, done: false })
  const must = !!profile?.mustChangePassword

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    if (form.next.length < 6) return setState({ busy: false, error: 'Your new password must be at least 6 characters.', done: false })
    if (form.next !== form.again) return setState({ busy: false, error: 'The two new passwords do not match.', done: false })
    if (form.next === form.current) return setState({ busy: false, error: 'Choose a password different from your current one.', done: false })
    setState({ busy: true, error: null, done: false })
    try {
      await changePassword(user, form.current, form.next)
      await refreshProfile()
      setForm({ current: '', next: '', again: '' })
      setState({ busy: false, error: null, done: true })
    } catch (err) {
      const code = err?.code
      const msg =
        code === 'auth/wrong-password' || code === 'auth/invalid-credential'
          ? 'Your current password is not right.'
          : friendlyAuthError(err)
      setState({ busy: false, error: msg, done: false })
    }
  }

  async function handleLogOut() {
    await logOut()
    navigate('/')
  }

  return (
    <div className="max-w-[520px] mx-auto px-5 sm:px-7 py-10 sm:py-14">
      <div className="font-mono text-xs tracking-wider text-flame uppercase mb-2 font-medium">Account</div>
      <h1 className="font-display text-2xl font-semibold mb-1">{profile?.username || 'Your account'}</h1>
      <p className="text-sm text-graphite/60 mb-6">{profile?.phoneNumber}</p>

      <section className="bg-white border border-line rounded-2xl p-6">
        <h2 className="font-display text-lg font-semibold mb-1">Change password</h2>
        {must && (
          <p className="text-sm text-flame mb-3" data-testid="must-change-note">
            You are using a temporary password. Please choose your own now.
          </p>
        )}
        <form onSubmit={submit} className="space-y-4 mt-3">
          <PwField label={must ? 'Temporary password' : 'Current password'} value={form.current} onChange={update('current')} auto="current-password" testid="pw-current" />
          <PwField label="New password" value={form.next} onChange={update('next')} auto="new-password" testid="pw-new" />
          <PwField label="New password again" value={form.again} onChange={update('again')} auto="new-password" testid="pw-again" />
          {state.error && <div className="text-rose text-sm" data-testid="pw-error">{state.error}</div>}
          {state.done && <div className="text-sm text-mint font-medium" data-testid="pw-done">Password changed. Use it next time you log in.</div>}
          <button type="submit" disabled={state.busy} className="press w-full bg-cobalt text-white py-3.5 rounded font-medium text-sm disabled:opacity-60" data-testid="pw-submit">
            {state.busy ? 'Saving…' : 'Change password'}
          </button>
        </form>
      </section>

      <div className="flex justify-between items-center mt-6 text-sm">
        <Link to="/" className="text-cobalt font-medium py-2">Back to dashboard</Link>
        <button onClick={handleLogOut} className="press text-graphite/60 py-2 px-2">Log out</button>
      </div>
    </div>
  )
}

function PwField({ label, value, onChange, auto, testid }) {
  return (
    <label className="block">
      <span className="text-[13px] font-medium text-graphite/80">{label}</span>
      <input
        type="password"
        required
        autoComplete={auto}
        value={value}
        onChange={onChange}
        data-testid={testid}
        className="mt-1.5 w-full border border-line rounded px-3.5 py-2.5 text-sm focus:outline-none focus:border-cobalt"
      />
    </label>
  )
}
