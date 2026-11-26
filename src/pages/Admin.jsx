import React, { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import {
  adminResetPassword,
  adminSetDisabled,
  friendlyAdminError,
  generateTempPassword,
  loadAdminLog,
  loadStudents,
  whatsappNumber
} from '../lib/admin.js'
import { normalizePhone } from '../lib/phone.js'

const DAY = 864e5
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')
const lastActive = (s) => s.progressUpdatedAt || s.createdAt || null
const testsOf = (s) => (s.progress && Array.isArray(s.progress.tests) ? s.progress.tests : [])

function ago(iso) {
  if (!iso) return 'never'
  const d = Math.floor((Date.now() - Date.parse(iso)) / DAY)
  if (d <= 0) return 'today'
  if (d === 1) return 'yesterday'
  if (d < 30) return `${d} days ago`
  return fmtDate(iso)
}

export default function Admin() {
  const { user, isAdmin } = useAuth()
  const [students, setStudents] = useState(null)
  const [log, setLog] = useState([])
  const [error, setError] = useState(null)
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState(null)

  useEffect(() => {
    if (!isAdmin) return
    loadStudents()
      .then(setStudents)
      .catch(() => setError('Could not load the student list. Check the rules were published (see the setup guide).'))
    loadAdminLog().then(setLog).catch(() => {})
  }, [isAdmin])

  const stats = useMemo(() => {
    if (!students) return null
    const now = Date.now()
    const within = (iso, days) => iso && now - Date.parse(iso) < days * DAY
    const courseCount = {}
    let tests = 0
    for (const s of students) {
      tests += testsOf(s).length
      for (const c of s.courses || []) courseCount[c] = (courseCount[c] || 0) + 1
    }
    const top = Object.entries(courseCount).sort((a, b) => b[1] - a[1]).slice(0, 8)
    return {
      total: students.length,
      new7: students.filter((s) => within(s.createdAt, 7)).length,
      active7: students.filter((s) => within(lastActive(s), 7)).length,
      tests,
      blocked: students.filter((s) => s.disabled).length,
      top
    }
  }, [students])

  const shown = useMemo(() => {
    if (!students) return []
    const needle = q.trim().toLowerCase()
    const list = [...students].sort((a, b) => (lastActive(b) || '') .localeCompare(lastActive(a) || ''))
    if (!needle) return list
    const digits = needle.replace(/\D/g, '')
    return list.filter(
      (s) =>
        (s.username || '').toLowerCase().includes(needle) ||
        (s.email || '').toLowerCase().includes(needle) ||
        (digits &&
          (String(s.phoneNumber || '').replace(/\D/g, '').includes(digits) ||
            normalizePhone(s.phoneNumber).includes(digits) ||
            normalizePhone(s.phoneNumber).includes(normalizePhone(digits))))
    )
  }, [students, q])

  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />

  function patchStudent(uid, patch) {
    setStudents((list) => list.map((s) => (s.uid === uid ? { ...s, ...patch } : s)))
  }

  return (
    <div className="max-w-[1120px] mx-auto px-4 sm:px-7 py-8 sm:py-12">
      <div className="font-mono text-xs tracking-wider text-flame uppercase mb-2 font-medium">Admin</div>
      <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-1">Students and activity</h1>
      <p className="text-sm text-graphite/60 mb-7">Only admin accounts can see this page. Be careful with what you see here: it is private student information.</p>

      {error && <div className="text-rose text-sm mb-5" data-testid="admin-error">{error}</div>}
      {!students && !error && <div className="text-sm text-graphite/60">Loading students…</div>}

      {stats && (
        <>
          <section className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6" data-testid="admin-stats">
            <Stat label="Students" value={stats.total} id="total" />
            <Stat label="Joined this week" value={stats.new7} id="new7" />
            <Stat label="Active this week" value={stats.active7} id="active7" />
            <Stat label="Tests taken" value={stats.tests} id="tests" />
            <Stat label="Blocked" value={stats.blocked} id="blocked" />
          </section>

          {stats.top.length > 0 && (
            <section className="bg-white border border-line rounded-2xl p-5 sm:p-6 mb-6">
              <h2 className="font-display text-base font-semibold mb-3">Most added courses</h2>
              <div className="space-y-2">
                {stats.top.map(([code, n]) => (
                  <div key={code} className="flex items-center gap-3 text-sm">
                    <span className="w-20 font-mono text-xs text-cobalt-deep shrink-0">{code}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-paper-2 overflow-hidden">
                      <div className="h-full bg-cobalt rounded-full" style={{ width: `${Math.max(4, (n / stats.top[0][1]) * 100)}%` }} />
                    </div>
                    <span className="w-8 text-right font-mono text-xs">{n}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="bg-white border border-line rounded-2xl overflow-hidden mb-6">
            <div className="p-4 sm:p-5 border-b border-line">
              <label className="block">
                <span className="sr-only">Search students</span>
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by name, phone number or email"
                  className="w-full border border-line rounded px-3.5 py-2.5 text-sm focus:outline-none focus:border-cobalt"
                  data-testid="admin-search"
                />
              </label>
              <div className="text-xs text-graphite/50 mt-2">{shown.length} of {students.length} students, most recently active first</div>
            </div>
            {shown.length === 0 && <div className="p-6 text-sm text-graphite/60">No students match that search.</div>}
            <ul>
              {shown.map((s) => (
                <li key={s.uid} className="border-t border-line first:border-t-0">
                  <button
                    onClick={() => setOpenId(openId === s.uid ? null : s.uid)}
                    className="w-full text-left px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-paper-2/60"
                    aria-expanded={openId === s.uid}
                    data-testid="student-row"
                  >
                    <span className="min-w-0">
                      <span className="font-medium text-sm block truncate">
                        {s.username || 'No name'}
                        {s.disabled && <span className="ml-2 text-[11px] font-mono text-rose">BLOCKED</span>}
                        {s.mustChangePassword && <span className="ml-2 text-[11px] font-mono text-flame">TEMP PASSWORD</span>}
                      </span>
                      <span className="text-xs text-graphite/55 block truncate">{s.phoneNumber || 'no number'} · {s.faculty || 'no faculty yet'}</span>
                    </span>
                    <span className="text-right shrink-0 text-xs text-graphite/55">
                      <span className="block">{testsOf(s).length} test{testsOf(s).length === 1 ? '' : 's'}</span>
                      <span className="block">{ago(lastActive(s))}</span>
                    </span>
                  </button>
                  {openId === s.uid && <StudentPanel s={s} onChange={(p) => patchStudent(s.uid, p)} onLog={() => loadAdminLog().then(setLog).catch(() => {})} />}
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-white border border-line rounded-2xl p-5 sm:p-6">
            <h2 className="font-display text-base font-semibold mb-3">Recent admin actions</h2>
            {log.length === 0 ? (
              <p className="text-sm text-graphite/60">Nothing yet. Password resets and blocks will be listed here.</p>
            ) : (
              <ul className="text-sm divide-y divide-line">
                {log.map((l) => {
                  const target = (students || []).find((s) => s.uid === l.target)
                  const by = (students || []).find((s) => s.uid === l.by)
                  return (
                    <li key={l.id} className="py-2 flex flex-wrap justify-between gap-x-4">
                      <span>
                        <span className="font-medium">{l.action}</span> for {target ? target.username : l.target}
                        <span className="text-graphite/50"> by {by ? by.username : 'admin'}</span>
                      </span>
                      <span className="text-xs text-graphite/50">{l.at ? new Date(l.at).toLocaleString('en-GB') : ''}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}

function Stat({ label, value, id }) {
  return (
    <div className="bg-white border border-line rounded-xl p-4" data-testid={`stat-${id}`}>
      <div className="font-display text-2xl font-bold">{value}</div>
      <div className="text-xs text-graphite/60 mt-0.5">{label}</div>
    </div>
  )
}

function StudentPanel({ s, onChange, onLog }) {
  const [mode, setMode] = useState(null) // null | 'reset' | 'block'
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [done, setDone] = useState(null) // { password } after a successful reset
  const tests = testsOf(s)
  const recent = [...tests].sort((a, b) => (a.takenAt < b.takenAt ? 1 : -1)).slice(0, 6)

  function startReset() {
    setPw(generateTempPassword())
    setMode('reset')
    setMsg(null)
    setDone(null)
  }

  async function doReset() {
    setBusy(true)
    setMsg(null)
    try {
      await adminResetPassword(s.uid, pw)
      onChange({ mustChangePassword: true })
      setDone({ password: pw })
      setMode(null)
      onLog()
    } catch (e) {
      setMsg(friendlyAdminError(e))
    } finally {
      setBusy(false)
    }
  }

  async function doBlock(disabled) {
    setBusy(true)
    setMsg(null)
    try {
      await adminSetDisabled(s.uid, disabled)
      onChange({ disabled })
      setMode(null)
      setMsg(disabled ? 'Blocked. They cannot log in until you unblock them.' : 'Unblocked. They can log in again.')
      onLog()
    } catch (e) {
      setMsg(friendlyAdminError(e))
    } finally {
      setBusy(false)
    }
  }

  const waText = done
    ? `Hello ${s.username || ''}, your FirstClass temporary password is: ${done.password}\nLog in with your phone number and this password. You will then be asked to choose your own password.`
    : ''

  return (
    <div className="px-4 sm:px-5 pb-5 pt-1 bg-paper-2/40" data-testid="student-panel">
      <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-1.5 text-sm mb-4">
        <Row k="Phone" v={s.phoneNumber} />
        <Row k="Email" v={s.email || 'not given'} />
        <Row k="Faculty" v={s.faculty} />
        <Row k="Joined" v={fmtDate(s.createdAt)} />
        <Row k="Last active" v={ago(lastActive(s))} />
        <Row k="Courses" v={(s.courses || []).join(', ') || 'none yet'} />
      </dl>
      {recent.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-medium text-graphite/70 mb-1">Latest tests</div>
          <ul className="text-sm text-graphite/80 grid sm:grid-cols-2 gap-x-8">
            {recent.map((t, i) => (
              <li key={i} className="flex justify-between border-b border-line/60 py-1">
                <span className="font-mono text-xs text-cobalt-deep">{t.courseCode}</span>
                <span>{t.score}/100 <span className="text-xs text-graphite/50">· {fmtDate(t.takenAt)}</span></span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {done && (
        <div className="rounded-lg border border-cobalt/30 bg-cobalt-pale p-4 mb-4 text-sm" data-testid="reset-done">
          <div className="font-medium mb-1">Password changed. Send this to the student:</div>
          <div className="font-mono text-base bg-white border border-line rounded px-3 py-2 inline-block select-all" data-testid="temp-password">{done.password}</div>
          <div className="text-xs text-graphite/60 mt-2">It will not be shown again. They are signed out everywhere and will be asked to choose their own password after logging in.</div>
          <div className="flex flex-wrap gap-2 mt-3">
            <a
              href={`https://wa.me/${whatsappNumber(s.phoneNumber)}?text=${encodeURIComponent(waText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="press bg-cobalt text-white text-sm font-medium px-4 py-2.5 rounded"
            >
              Send on WhatsApp
            </a>
            <button onClick={() => navigator.clipboard && navigator.clipboard.writeText(done.password)} className="press border border-line bg-white text-sm font-medium px-4 py-2.5 rounded">
              Copy password
            </button>
          </div>
        </div>
      )}

      {mode === 'reset' && (
        <div className="rounded-lg border border-line bg-white p-4 mb-4" data-testid="reset-confirm">
          <div className="text-sm font-medium mb-2">Set a temporary password for {s.username}</div>
          <div className="flex flex-wrap gap-2 items-center">
            <input
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="font-mono text-sm border border-line rounded px-3 py-2 w-56 focus:outline-none focus:border-cobalt"
              aria-label="Temporary password"
              data-testid="reset-input"
            />
            <button onClick={() => setPw(generateTempPassword())} className="press text-sm text-cobalt font-medium px-2 py-2">New random one</button>
          </div>
          <div className="text-xs text-graphite/55 mt-2">8 to 64 characters. They will be signed out on every device.</div>
          <div className="flex gap-2 mt-3">
            <button disabled={busy || pw.length < 8} onClick={doReset} className="press bg-flame text-white text-sm font-medium px-4 py-2.5 rounded disabled:opacity-50" data-testid="reset-go">
              {busy ? 'Working…' : 'Reset password'}
            </button>
            <button onClick={() => setMode(null)} className="press border border-line text-sm px-4 py-2.5 rounded">Cancel</button>
          </div>
        </div>
      )}

      {mode === 'block' && (
        <div className="rounded-lg border border-line bg-white p-4 mb-4 text-sm" data-testid="block-confirm">
          {s.disabled ? 'Let this student log in again?' : `Block ${s.username}? They will be logged out and cannot log in until you unblock them.`}
          <div className="flex gap-2 mt-3">
            <button disabled={busy} onClick={() => doBlock(!s.disabled)} className="press bg-flame text-white text-sm font-medium px-4 py-2.5 rounded disabled:opacity-50" data-testid="block-go">
              {busy ? 'Working…' : s.disabled ? 'Yes, unblock' : 'Yes, block'}
            </button>
            <button onClick={() => setMode(null)} className="press border border-line text-sm px-4 py-2.5 rounded">Cancel</button>
          </div>
        </div>
      )}

      {msg && <div className="text-sm mb-3 text-graphite/80" data-testid="panel-msg">{msg}</div>}

      {!mode && (
        <div className="flex flex-wrap gap-2">
          <button onClick={startReset} className="press bg-graphite text-white text-sm font-medium px-4 py-2.5 rounded" data-testid="reset-start">
            Reset password
          </button>
          <button onClick={() => { setMode('block'); setMsg(null) }} className="press border border-line bg-white text-sm font-medium px-4 py-2.5 rounded" data-testid="block-start">
            {s.disabled ? 'Unblock' : 'Block account'}
          </button>
        </div>
      )}
    </div>
  )
}

function Row({ k, v }) {
  return (
    <div className="flex gap-2 min-w-0">
      <dt className="text-graphite/50 w-20 sm:w-24 shrink-0">{k}</dt>
      <dd className="min-w-0 [overflow-wrap:anywhere]">{v || '—'}</dd>
    </div>
  )
}
