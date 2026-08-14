import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase.js'
import { useAuth } from '../context/AuthContext.jsx'

// Placeholder catalog — swap for a Firestore `courses` query, filtered
// by the student's faculty (with an option to add courses outside it,
// since some students take cross-faculty electives).
const COURSE_CATALOG = [
  { code: 'MTH101', title: 'Elementary Mathematics I', faculty: 'Sciences' },
  { code: 'PHY101', title: 'General Physics I', faculty: 'Sciences' },
  { code: 'CHM101', title: 'General Chemistry I', faculty: 'Sciences' },
  { code: 'ENG102', title: 'Engineering Drawing', faculty: 'Engineering' },
  { code: 'ECO101', title: 'Principles of Economics I', faculty: 'Social Sciences' },
  { code: 'ACC101', title: 'Introduction to Financial Accounting', faculty: 'Management Sciences' },
  { code: 'GST101', title: 'Use of English', faculty: 'General Studies' }
]

export default function AddCourses() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(new Set(profile?.courses || []))
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return COURSE_CATALOG
    return COURSE_CATALOG.filter(
      (c) => c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)
    )
  }, [query])

  function toggle(code) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(code) ? next.delete(code) : next.add(code)
      return next
    })
  }

  async function handleFinish() {
    if (!user) return
    setSaving(true)
    await updateDoc(doc(db, 'users', user.uid), { courses: Array.from(selected) })
    await refreshProfile()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-paper px-6 py-16">
      <div className="max-w-[640px] mx-auto">
        <div className="font-mono text-xs tracking-wider text-flame uppercase mb-3 font-medium">
          Step 2 of 2
        </div>
        <h1 className="font-display text-2xl font-semibold mb-2">Add your courses</h1>
        <p className="text-graphite/60 text-sm mb-6">
          Search and add the courses you're offering this session. You can add more later.
        </p>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by course code or title…"
          className="w-full border border-line rounded px-4 py-3 text-sm mb-5 focus:outline-none focus:border-cobalt bg-white"
        />

        <div className="space-y-2 mb-8">
          {filtered.map((course) => {
            const isSelected = selected.has(course.code)
            return (
              <button
                key={course.code}
                onClick={() => toggle(course.code)}
                className={`w-full flex items-center justify-between border rounded-lg px-4 py-3.5 text-left transition-colors ${
                  isSelected ? 'border-cobalt bg-cobalt-pale' : 'border-line bg-white hover:border-cobalt/50'
                }`}
              >
                <div>
                  <div className="font-mono text-xs text-cobalt-deep font-medium mb-0.5">{course.code}</div>
                  <div className="text-sm font-medium">{course.title}</div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${
                    isSelected ? 'bg-cobalt border-cobalt text-white' : 'border-line text-transparent'
                  }`}
                >
                  ✓
                </div>
              </button>
            )
          })}
          {filtered.length === 0 && (
            <div className="text-sm text-graphite/50 text-center py-8">No courses match "{query}"</div>
          )}
        </div>

        <button
          onClick={handleFinish}
          disabled={selected.size === 0 || saving}
          className="w-full bg-cobalt text-white py-3 rounded font-medium text-sm disabled:opacity-40"
        >
          {saving ? 'Saving…' : `Continue with ${selected.size} course${selected.size === 1 ? '' : 's'}`}
        </button>
      </div>
    </div>
  )
}
