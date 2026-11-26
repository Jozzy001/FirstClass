import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getCourse } from '../data/courseData.js'
import { getCourseProgress } from '../lib/progress.js'
import { getLesson } from '../lib/lessons.js'
import { reducedMotion, useCountUp } from '../lib/useMotion.js'
import { getMotionChoice, setMotionChoice, systemPrefersReduced } from '../lib/motionPref.js'
import { calculateGPA, classify, findWeakTopics, overallAccuracy, scoreToGrade } from '../lib/grading.js'
import {
  computeStreak,
  dayKey,
  getActivity,
  getCourseScores,
  getTopicStats,
  loadDraft
} from '../lib/store.js'

const DAILY_GOAL = 20 // questions per day

const TIPS = [
  { title: 'Test yourself before you read', body: 'Try a few practice questions on a topic first. Getting some wrong makes the notes stick far better when you read them afterwards.' },
  { title: 'Study in 25-minute blocks', body: 'Focus fully for 25 minutes, rest for 5, and repeat. Use the focus timer on this page and put your phone face down.' },
  { title: 'Revise weak topics first', body: 'Start each session with the topics below 60%. Fixing a weak topic raises your score faster than polishing a strong one.' },
  { title: 'Space your revision', body: 'Come back to a topic after 1 day, 3 days and 7 days. Short repeated reviews beat one long cram the night before.' },
  { title: 'Explain it out loud', body: 'After reading a topic, close the notes and explain it in your own words. Where you get stuck is where to read again.' },
  { title: 'Learn the key formula', body: 'Every topic ends with a key formula or key fact. Copy those onto one page per course and read it every morning.' },
  { title: 'Practise under exam conditions', body: 'Take the timed course test with no notes and no phone. The 45-minute limit trains you to pace yourself.' },
  { title: 'Sleep before the exam', body: 'A full night of sleep helps memory more than another late hour of reading. Stop revising at a sensible time.' }
]

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export default function Dashboard() {
  const { profile } = useAuth()

  const data = useMemo(() => {
    const scores = getCourseScores()
    const topicStats = getTopicStats()
    const activity = getActivity()

    const statByTopic = {}
    for (const t of topicStats) statByTopic[`${t.courseCode}::${t.topicId}`] = t

    const myCodes = profile?.courses || []
    const courses = myCodes.map((code) => {
      const course = getCourse(code)
      if (!course) return { code, ready: false }
      const topics = course.topics
      const progress = getCourseProgress(course)
      const next = progress.nextTopic
      const stats = topicStats.filter((t) => t.courseCode === code)
      return {
        code,
        ready: true,
        title: course.title,
        creditUnits: course.creditUnits,
        total: progress.total,
        covered: progress.done,
        pct: progress.pct,
        unit: 'topics',
        next,
        accuracy: overallAccuracy(stats),
        last: scores[code]?.latest || null,
        best: scores[code]?.best || null,
        draft: !!loadDraft(code)
      }
    })

    const tested = courses
      .filter((c) => c.ready && c.last)
      .map((c) => ({ courseCode: c.code, creditUnits: c.creditUnits, score: c.last.score }))
    const gpa = calculateGPA(tested)

    const mine = new Set(myCodes)
    const weak = findWeakTopics(topicStats.filter((t) => mine.has(t.courseCode) && getCourse(t.courseCode)))
      .slice(0, 4)
      .map((w) => ({ ...w, courseTitle: getCourse(w.courseCode).title }))

    const today = dayKey(new Date())
    const answeredToday = activity.answeredByDay[today] || 0
    const week = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return { key: dayKey(d), label: d.toLocaleDateString('en-GB', { weekday: 'narrow' }), isToday: i === 6, active: activity.days.has(dayKey(d)) }
    })

    let resume = null
    if (activity.last && mine.has(activity.last.courseCode)) {
      const c = getCourse(activity.last.courseCode)
      const t = c?.topics.find((x) => x.id === activity.last.topicId)
      if (c && t) resume = { courseCode: c.code, topicId: t.id, topicTitle: t.title, kind: activity.last.kind, hasLesson: !!getLesson(c.code, t.id) }
    }

    return {
      courses,
      tested,
      gpa,
      cls: classify(gpa.gpa),
      weak,
      answeredToday,
      week,
      streak: computeStreak(activity.days),
      resume,
      draftCourse: courses.find((c) => c.draft)?.code || null,
      hasAnyActivity: activity.days.size > 0
    }
  }, [profile])

  const { courses, tested, gpa, cls, weak, answeredToday, week, streak, resume, draftCourse } = data
  const name = profile?.username || 'Student'
  const gpaShown = useCountUp(gpa.gpa, { decimals: 2, duration: 1100, delay: 150 })
  const answeredShown = useCountUp(answeredToday, { delay: 250 })
  const streakShown = useCountUp(streak, { delay: 350, duration: 700 })
  const tip = TIPS[Math.floor(Date.now() / 86400000) % TIPS.length]
  const goalPct = Math.min(100, Math.round((answeredToday / DAILY_GOAL) * 100))
  const dateLabel = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  // The single best next action for this student right now.
  const readyCourses = courses.filter((c) => c.ready)
  let focus
  if (draftCourse) {
    focus = { label: 'Test in progress', title: `Finish your ${draftCourse} test`, to: `/course/${draftCourse}/test`, cta: 'Resume test' }
  } else if (resume) {
    focus = {
      label: 'Pick up where you left off',
      title: resume.topicTitle,
      sub: resume.courseCode,
      to: `/course/${resume.courseCode}/${resume.kind === 'read' && !resume.hasLesson ? 'practice' : 'read'}/${resume.topicId}`,
      cta: resume.hasLesson ? 'Continue lesson' : resume.kind === 'read' ? 'Practise it' : 'Read the notes'
    }
  } else if (readyCourses[0]) {
    const c = readyCourses[0]
    focus = {
      label: 'Start here',
      title: c.next ? c.next.title : c.title,
      sub: c.code,
      to: c.next ? `/course/${c.code}/read/${c.next.id}` : `/course/${c.code}`,
      cta: 'Start reading'
    }
  }

  return (
    <div className="max-w-[1120px] mx-auto px-4 sm:px-7 py-8 sm:py-12">
      {/* Greeting */}
      <div className="mb-7 rise" style={{ '--i': 0 }}>
        <div className="font-mono text-xs tracking-wider text-flame uppercase mb-2 font-medium">{dateLabel}</div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold -tracking-wide">
          {greeting()}, {name}
        </h1>
        {profile?.faculty && <p className="text-graphite/60 text-sm mt-1.5">Faculty of {profile.faculty}</p>}
      </div>

      <MotionNotice />

      {/* Headline stats */}
      <section className="grid gap-4 md:grid-cols-[1.3fr_1fr_1fr] mb-4">
        <div className="bg-graphite text-white rounded-2xl p-6 sm:p-7 rise sheen" style={{ '--i': 1 }} data-testid="cgpa-card">
          <div className="font-mono text-[11px] text-white/60 uppercase tracking-wide mb-2">Your CGPA</div>
          <div className="font-display text-5xl sm:text-6xl font-bold leading-none">
            {gpa.gpa === null ? '—' : gpaShown}
            <span className="text-lg text-white/40"> / 5.00</span>
          </div>
          <div className="text-sm text-white/70 mt-3">
            {tested.length === 0 && 'Take a course test to start your CGPA.'}
            {tested.length > 0 && gpa.gpa !== null && cls && (
              <>
                {cls.name}
                {cls.nextName && ` · ${cls.pointsToNext.toFixed(2)} points to ${cls.nextName}`}
              </>
            )}
          </div>
          {gpa.gpa !== null && gpa.assumed.length > 0 && (
            <div className="text-[11.5px] text-white/50 mt-2" data-testid="cgpa-estimate">
              Estimate: credit units are still being added, so {gpa.assumed.join(', ')} count as 1 unit each.
            </div>
          )}
          <Link to="/results" className="inline-block text-sm text-white/80 underline underline-offset-4 mt-2 py-2">
            Full result slip
          </Link>
        </div>

        <div className="bg-white border border-line rounded-2xl p-6 rise" style={{ '--i': 2 }} data-testid="goal-card">
          <div className="font-mono text-[11px] text-graphite/50 uppercase tracking-wide mb-3">Today's goal</div>
          <div className="flex items-center gap-4">
            <Ring pct={goalPct} hit={answeredToday >= DAILY_GOAL} />
            <div>
              <div className="font-display text-2xl font-bold leading-none">
                {answeredShown}<span className="text-graphite/40 text-base"> / {DAILY_GOAL}</span>
              </div>
              <div className="text-xs text-graphite/60 mt-1.5">
                {answeredToday >= DAILY_GOAL ? 'Goal reached. Well done!' : 'questions answered'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-line rounded-2xl p-6 rise" style={{ '--i': 3 }} data-testid="streak-card">
          <div className="font-mono text-[11px] text-graphite/50 uppercase tracking-wide mb-3">Study streak</div>
          <div className="font-display text-4xl font-bold leading-none">
            {streak > 0 && <span className="flicker mr-1.5 text-3xl" aria-hidden="true">🔥</span>}{streakShown}<span className="text-graphite/40 text-base"> day{streak === 1 ? '' : 's'}</span>
          </div>
          <div className="flex gap-1.5 mt-4">
            {week.map((d, di) => (
              <div key={d.key} className="flex flex-col items-center gap-1">
                <div
                  style={{ '--i': di }}
                  className={`w-7 h-7 rounded-md text-[11px] flex items-center justify-center ${
                    d.active ? 'bg-mint text-white pop' : 'bg-paper-2 text-transparent'
                  } ${d.isToday ? 'ring-2 ring-cobalt/40' : ''}`}
                >
                  ✓
                </div>
                <span className="text-[11px] text-graphite/50">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Next best action */}
      {focus && (
        <section className="bg-flame-pale border border-flame/20 rounded-2xl p-5 sm:p-6 mb-8 flex flex-wrap items-center justify-between gap-4 rise" style={{ '--i': 4 }} data-testid="focus-card">
          <div>
            <div className="font-mono text-[11px] text-flame uppercase tracking-wide mb-1.5">{focus.label}</div>
            <div className="font-display text-lg font-semibold">{focus.title}</div>
            {focus.sub && <div className="text-xs text-graphite/60 mt-0.5 font-mono">{focus.sub}</div>}
          </div>
          <Link to={focus.to} className="press bg-flame text-white px-5 py-3 rounded font-medium text-sm">
            {focus.cta}
          </Link>
        </section>
      )}

      {/* Courses */}
      <section className="mb-10" data-testid="courses-section">
        <div className="flex items-end justify-between mb-4 rise" style={{ '--i': 5 }}>
          <h2 className="font-display text-xl font-semibold -tracking-wide">My courses</h2>
          <Link to="/add-courses" className="text-sm text-cobalt font-medium py-2">+ Add or remove courses</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c, ci) => (
            <CourseProgressCard key={c.code} c={c} index={ci} />
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4 mb-10 items-start [&>*]:min-w-0">
        {/* Weak topics */}
        <section className="bg-white border border-line rounded-2xl p-6 rise" style={{ '--i': 7 }} data-testid="weak-card">
          <h2 className="font-display text-lg font-semibold mb-1">Needs your attention</h2>
          <p className="text-xs text-graphite/60 mb-4">Topics where you scored under 60% recently.</p>
          {weak.length === 0 ? (
            <p className="text-sm text-graphite/60">
              Nothing weak yet. Practise a few topics and the ones that need work will show up here.
            </p>
          ) : (
            <div className="divide-y divide-line">
              {weak.map((w) => (
                <div key={`${w.courseCode}-${w.topicId}`} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{w.topicName}</div>
                    <div className="text-xs text-graphite/50 font-mono">
                      {w.courseCode} · {Math.round(w.accuracy * 100)}% correct
                    </div>
                  </div>
                  <Link
                    to={`/course/${w.courseCode}/practice/${w.topicId}`}
                    className="press shrink-0 text-[13px] font-medium text-white bg-cobalt px-4 py-2.5 rounded"
                  >
                    Practise
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="space-y-4">
          <FocusTimer />
          <section className="bg-mint-pale border border-mint/20 rounded-2xl p-6 rise" style={{ '--i': 9 }} data-testid="tip-card">
            <div className="font-mono text-[11px] text-mint uppercase tracking-wide mb-2">Study tip</div>
            <div className="font-display text-[15px] font-semibold mb-1.5">{tip.title}</div>
            <p className="text-sm text-graphite/70 leading-relaxed">{tip.body}</p>
          </section>
        </div>
      </div>
      <div className="mt-8 text-center text-[13px] text-graphite/55">
        <Link to="/account" className="inline-block py-2 px-2 underline underline-offset-4" data-testid="account-link">
          Account and password
        </Link>
      </div>
    </div>
  )
}

function Ring({ pct, hit }) {
  const r = 26
  const c = 2 * Math.PI * r
  const [shown, setShown] = useState(reducedMotion() ? pct : 0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(pct))
    return () => cancelAnimationFrame(id)
  }, [pct])
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className={`shrink-0 ${hit ? 'glow-ring' : ''}`} role="img" aria-label={`${pct}% of daily goal`}>
      <circle cx="32" cy="32" r={r} fill="none" stroke="#F1F0EA" strokeWidth="7" />
      <circle
        cx="32" cy="32" r={r} fill="none" stroke={hit ? '#0F9E72' : '#2451E0'} strokeWidth="7" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c - (c * shown) / 100} transform="rotate(-90 32 32)"
        style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.22, 1, 0.36, 1) 0.3s' }}
      />
      <text x="32" y="36" textAnchor="middle" fontSize="13" fontWeight="700" fill="#14171C">{pct}%</text>
    </svg>
  )
}

function CourseProgressCard({ c, index = 0 }) {
  if (!c.ready) {
    return (
      <div className="bg-white border border-line rounded-xl p-5 opacity-70">
        <div className="font-mono text-xs text-cobalt-deep font-medium mb-2">{c.code}</div>
        <div className="text-sm text-graphite/60">Notes and questions for this course are coming soon.</div>
      </div>
    )
  }
  const pct = c.pct
  const grade = c.last ? scoreToGrade(c.last.score) : null
  return (
    <div className="bg-white border border-line rounded-xl p-5 flex flex-col lift rise" style={{ '--i': index + 6 }} data-testid={`course-${c.code}`}>
      <Link to={`/course/${c.code}`} className="block mb-4">
        <div className="flex justify-between items-start mb-2 min-h-[26px]">
          <span className="font-mono text-xs text-cobalt-deep font-medium">{c.code}</span>
          {grade && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-cobalt-pale text-cobalt-deep">
              {c.last.score}/100 · {grade.letter}
            </span>
          )}
        </div>
        <div className="font-display text-[15px] font-semibold leading-snug">{c.title}</div>
      </Link>

      <div className="h-2 bg-paper-2 rounded-full overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full bg-cobalt rounded-full bar-grow" style={{ width: `${pct}%`, '--i': index }} />
      </div>
      <div className="text-[11.5px] text-graphite/60 mt-1.5 mb-4">
        {c.covered === 0 ? 'Not started' : `${c.covered} of ${c.total} ${c.unit} · ${pct}%`}
        {c.accuracy !== null && ` · ${c.accuracy}% accuracy`}
      </div>

      <div className="mt-auto flex gap-2">
        <Link
          to={c.next ? `/course/${c.code}/read/${c.next.id}` : `/course/${c.code}`}
          className="press flex-1 text-center text-[13px] font-medium bg-cobalt text-white py-2.5 rounded"
        >
          {c.covered === 0 ? 'Start' : c.next ? 'Continue' : 'Revise'}
        </Link>
        <Link to={`/course/${c.code}/test`} className="press flex-1 text-center text-[13px] font-medium border border-line py-2.5 rounded hover:border-cobalt">
          {c.draft ? 'Resume test' : c.last ? 'Retake test' : 'Take test'}
        </Link>
      </div>
    </div>
  )
}

const MODES = { focus: { label: 'Focus', mins: 25 }, rest: { label: 'Break', mins: 5 } }

function FocusTimer() {
  const [mode, setMode] = useState('focus')
  const [left, setLeft] = useState(MODES.focus.mins * 60)
  const [endAt, setEndAt] = useState(null) // set while running, so the timer stays right if the tab sleeps
  const [done, setDone] = useState(false)
  const tick = useRef(null)

  useEffect(() => {
    if (!endAt) return undefined
    tick.current = setInterval(() => {
      const remaining = Math.max(0, Math.round((endAt - Date.now()) / 1000))
      setLeft(remaining)
      if (remaining === 0) {
        setEndAt(null)
        setDone(true)
        try { navigator.vibrate?.(300) } catch { /* not supported */ }
      }
    }, 500)
    return () => clearInterval(tick.current)
  }, [endAt])

  function switchMode(m) {
    setMode(m)
    setEndAt(null)
    setDone(false)
    setLeft(MODES[m].mins * 60)
  }
  function toggle() {
    if (endAt) {
      setEndAt(null)
    } else {
      setDone(false)
      setEndAt(Date.now() + (left || MODES[mode].mins * 60) * 1000)
    }
  }
  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')

  return (
    <section className="bg-white border border-line rounded-2xl p-6" data-testid="timer-card">
      <div className="flex items-center justify-between mb-3">
        <div className="font-mono text-[11px] text-graphite/50 uppercase tracking-wide">Focus timer</div>
        <div className="flex gap-1">
          {Object.entries(MODES).map(([k, m]) => (
            <button
              key={k}
              onClick={() => switchMode(k)}
              className={`press text-xs px-3 py-2 rounded font-medium ${mode === k ? 'bg-graphite text-white' : 'text-graphite/60'}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div className="font-display text-4xl font-bold leading-none mb-2" data-testid="timer-time">{mm}:{ss}</div>
      <div className="text-xs text-graphite/60 mb-4 min-h-[16px]">
        {done ? (mode === 'focus' ? 'Session done. Take a 5-minute break.' : 'Break over. Back to it!') : 'One session, one topic. No phone.'}
      </div>
      <div className="flex gap-2">
        <button onClick={toggle} className="press flex-1 bg-cobalt text-white text-[13px] font-medium py-2.5 rounded">
          {endAt ? 'Pause' : left === MODES[mode].mins * 60 ? 'Start' : 'Resume'}
        </button>
        <button onClick={() => switchMode(mode)} className="press px-4 border border-line text-[13px] font-medium py-2.5 rounded">
          Reset
        </button>
      </div>
    </section>
  )
}

// Shown only when the phone has animations switched off. Lets the student turn them on for this app.
function MotionNotice() {
  if (!systemPrefersReduced()) return null
  const forced = getMotionChoice() === 'full'
  function change() {
    setMotionChoice(forced ? 'system' : 'full')
    window.location.reload()
  }
  return (
    <div className="bg-flame-pale border border-flame/20 rounded-xl px-4 py-3 mb-5 flex flex-wrap items-center justify-between gap-2 text-[13.5px]" data-testid="motion-notice">
      <span className="text-graphite/75">
        {forced
          ? 'Animations are on, even though your phone has them switched off.'
          : 'Your phone has animations switched off, so FirstClass is showing the still version.'}
      </span>
      <button onClick={change} className="press font-medium text-flame py-2">
        {forced ? 'Follow my phone setting' : 'Turn animations on'}
      </button>
    </div>
  )
}
