import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase.js'
import { useAuth } from '../context/AuthContext.jsx'

// Placeholder list — swap for a Firestore `faculties` collection query
// once real faculty/course data is loaded in.
const FACULTIES = [
  'Sciences',
  'Engineering',
  'Social Sciences',
  'Management Sciences',
  'Arts',
  'General Studies'
]

export default function PickFaculty() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleContinue() {
    if (!selected || !user) return
    setSaving(true)
    await updateDoc(doc(db, 'users', user.uid), { faculty: selected })
    await refreshProfile()
    navigate('/add-courses')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-6 py-16">
      <div className="w-full max-w-[480px]">
        <div className="font-mono text-xs tracking-wider text-flame uppercase mb-3 font-medium">
          Step 1 of 2
        </div>
        <h1 className="font-display text-2xl font-semibold mb-2">What's your faculty?</h1>
        <p className="text-graphite/60 text-sm mb-7">
          This helps us show you the right courses. You can change this later.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {FACULTIES.map((faculty) => (
            <button
              key={faculty}
              onClick={() => setSelected(faculty)}
              className={`text-left border rounded-lg px-4 py-3.5 text-sm font-medium transition-colors ${
                selected === faculty
                  ? 'border-cobalt bg-cobalt-pale text-cobalt-deep'
                  : 'border-line bg-white hover:border-cobalt/50'
              }`}
            >
              {faculty}
            </button>
          ))}
        </div>

        <button
          onClick={handleContinue}
          disabled={!selected || saving}
          className="w-full bg-cobalt text-white py-3 rounded font-medium text-sm disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Continue'}
        </button>
      </div>
    </div>
  )
}
