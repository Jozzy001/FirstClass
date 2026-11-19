import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getAllCourses } from '../data/courseData.js'
import { calculateGPA, classify, findWeakTopics, scoreToGrade } from '../lib/grading.js'
import { getCourseScores, getTopicStats } from '../lib/store.js'
import { useAuth } from '../context/AuthContext.jsx'

function gradeColor(point) {
  return point >= 4 ? 'text-mint' : point >= 2 ? 'text-cobalt' : 'text-rose'
}

export default function Results() {
  const { profile } = useAuth() || {}
  const data = useMemo(() => {
    const courses = getAllCourses()
    const scores = getCourseScores()

    const tested = courses
      .filter((c) => scores[c.code])
      .map((c) => ({
        courseCode: c.code,
        title: c.title,
        creditUnits: c.creditUnits,
        score: scores[c.code].latest.score,
        best: scores[c.code].best.score,
        attempts: scores[c.code].attempts
      }))
    const untested = courses.filter((c) => !scores[c.code])

    const gpa = calculateGPA(tested)
    const titleByCode = Object.fromEntries(courses.map((c) => [c.code, c.title]))

    const weak = findWeakTopics(getTopicStats()).slice(0, 6)

    return { tested, untested, gpa, weak, titleByCode }
  }, [])

  const { tested, untested, gpa, weak, titleByCode } = data
  const cls = classify(gpa.gpa)
  const totalUnits = gpa.breakdown.reduce((s, r) => s + r.creditUnits, 0)
  const totalQP = gpa.breakdown.reduce((s, r) => s + r.qualityPoints, 0)
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const student = profile?.username || 'Student'

  if (tested.length === 0) {
    return (
      <div className="max-w-[640px] mx-auto px-5 sm:px-7 py-16 sm:py-24 text-center">
        <div className="font-mono text-xs tracking-wider text-flame uppercase mb-3 font-medium">Result slip</div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-3">No results yet</h1>
        <p className="text-graphite/60 mb-8">
          Take a course test and your score, grade and CGPA will appear here. Each test is out of 100.
        </p>
        <div className="grid sm:grid-cols-2 gap-3 text-left">
          {untested.map((c) => (
            <Link
              key={c.code}
              to={`/course/${c.code}/test`}
              className="bg-white border border-line rounded-lg p-4 hover:border-cobalt"
            >
              <div className="font-mono text-xs text-cobalt-deep">{c.code}</div>
              <div className="font-display text-[15px] font-semibold">{c.title}</div>
              <div className="text-xs text-cobalt font-medium mt-2">Take test →</div>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[900px] mx-auto px-5 sm:px-7 py-10 sm:py-14">
      {/* CGPA headline */}
      <section className="bg-graphite text-white rounded-2xl p-6 sm:p-9 mb-8 grid sm:grid-cols-[auto_1fr] gap-6 sm:gap-10 items-center no-print">
        <div>
          <div className="font-mono text-[11px] text-white/60 uppercase tracking-wide mb-2">Your CGPA</div>
          <div className="font-display text-6xl sm:text-7xl font-bold leading-none">
            {gpa.gpa === null ? '—' : gpa.gpa.toFixed(2)}
            <span className="text-xl text-white/40"> / 5.00</span>
          </div>
        </div>
        <div>
          {cls && (
            <>
              <div className="inline-block bg-flame text-white font-display text-sm font-semibold px-3 py-1.5 rounded mb-3">
                {cls.name}
              </div>
              <p className="text-sm text-white/70">
                {cls.nextName
                  ? `${cls.pointsToNext.toFixed(2)} points to ${cls.nextName}.`
                  : 'You are in the top class. Keep it there.'}
              </p>
            </>
          )}
          <div className="text-xs text-white/50 mt-3">
            Based on your latest score in {gpa.breakdown.length} course{gpa.breakdown.length === 1 ? '' : 's'} ·{' '}
            {totalUnits} credit units
            {untested.length > 0 && ` · ${untested.length} course${untested.length === 1 ? '' : 's'} not tested yet`}
          </div>
        </div>
      </section>

      {/* The slip itself */}
      <section className="bg-white border border-line rounded-2xl overflow-hidden mb-8 print-slip">
        <div className="px-5 sm:px-8 py-5 border-b border-line flex flex-wrap justify-between gap-3">
          <div>
            <div className="font-display text-lg font-semibold">
              First<span className="text-flame">Class</span> · Result Slip
            </div>
            <div className="text-sm text-graphite/60">{student}</div>
          </div>
          <div className="text-right text-sm text-graphite/60">
            <div>{today}</div>
            <div className="font-mono text-xs">5.0 scale</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px] sm:text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-graphite/50 bg-paper-2">
                <th className="px-3 sm:px-8 py-3 font-medium">Course</th>
                <th className="py-3 font-medium text-center">Units</th>
                <th className="py-3 font-medium text-center">Score</th>
                <th className="py-3 font-medium text-center">Grade</th>
                <th className="py-3 font-medium text-center">GP</th>
                <th className="px-3 sm:px-8 py-3 font-medium text-right">QP</th>
              </tr>
            </thead>
            <tbody>
              {gpa.breakdown.map((r) => (
                <tr key={r.courseCode} className="border-t border-line">
                  <td className="px-3 sm:px-8 py-3.5">
                    <div className="font-mono text-xs text-cobalt-deep">{r.courseCode}</div>
                    <div className="font-medium">{r.title}</div>
                  </td>
                  <td className="text-center font-mono">{r.creditUnits}</td>
                  <td className="text-center font-mono">{r.score}</td>
                  <td className={`text-center font-display font-semibold ${gradeColor(r.point)}`}>{r.letter}</td>
                  <td className="text-center font-mono">{r.point}</td>
                  <td className="px-3 sm:px-8 text-right font-mono">{r.qualityPoints}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-graphite bg-paper-2 font-medium">
                <td className="px-3 sm:px-8 py-3.5">Total</td>
                <td className="text-center font-mono">{totalUnits}</td>
                <td />
                <td />
                <td className="text-center text-xs text-graphite/50">GPA</td>
                <td className="px-3 sm:px-8 text-right font-mono whitespace-nowrap">
                  {totalQP} → {gpa.gpa === null ? '—' : gpa.gpa.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="px-5 sm:px-8 py-3 text-[11.5px] text-graphite/50 border-t border-line">
          GP = grade point (A 5 · B 4 · C 3 · D 2 · E 1 · F 0). QP = grade point × credit units.
          GPA = total QP ÷ total credit units. The score counted for each course is your latest attempt.
        </div>
      </section>

      <div className="flex flex-wrap gap-3 mb-12 no-print">
        <button
          onClick={() => window.print()}
          className="border border-line bg-white px-5 py-2.5 rounded text-sm font-medium"
        >
          Print or save as PDF
        </button>
      </div>

      {/* Per-course actions */}
      <section className="mb-12 no-print">
        <h2 className="font-display text-lg font-semibold mb-3">Improve a grade</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {tested.map((r) => {
            const g = scoreToGrade(r.score)
            return (
              <div key={r.courseCode} className="bg-white border border-line rounded-lg p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-xs text-cobalt-deep">{r.courseCode}</div>
                  <div className="text-sm">
                    Latest <strong>{r.score}</strong> ({g.letter}) · best {r.best} · {r.attempts} attempt
                    {r.attempts === 1 ? '' : 's'}
                  </div>
                </div>
                <Link to={`/course/${r.courseCode}/test`} className="text-cobalt text-sm font-medium flex-shrink-0">
                  Retake →
                </Link>
              </div>
            )
          })}
          {untested.map((c) => (
            <div key={c.code} className="bg-paper-2 border border-line rounded-lg p-4 flex items-center justify-between gap-3">
              <div>
                <div className="font-mono text-xs text-cobalt-deep">{c.code}</div>
                <div className="text-sm text-graphite/60">Not tested yet, so not in your CGPA</div>
              </div>
              <Link to={`/course/${c.code}/test`} className="text-cobalt text-sm font-medium flex-shrink-0">
                Take test →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Weak topics */}
      <section className="no-print">
        <h2 className="font-display text-lg font-semibold mb-1">Where to focus</h2>
        <p className="text-sm text-graphite/60 mb-4">
          Topics where you're getting under 60% right, based on your recent practice and tests.
        </p>
        {weak.length === 0 ? (
          <div className="bg-mint-pale rounded-lg p-4 text-sm">
            No weak topics right now. Everything you've attempted is at 60% or above.
          </div>
        ) : (
          <div className="space-y-2">
            {weak.map((w) => (
              <div
                key={`${w.courseCode}-${w.topicId}`}
                className="bg-white border border-line rounded-lg p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="font-mono text-xs text-cobalt-deep">
                    {w.courseCode} · {titleByCode[w.courseCode] || ''}
                  </div>
                  <div className="font-medium text-[15px]">{w.topicName}</div>
                  <div className="text-xs text-rose font-mono mt-0.5">
                    {Math.round(w.accuracy * 100)}% · {w.correct}/{w.total} correct
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Link
                    to={`/course/${w.courseCode}/read/${w.topicId}`}
                    className="border border-line px-3 py-2 rounded text-xs font-medium"
                  >
                    Read
                  </Link>
                  <Link
                    to={`/course/${w.courseCode}/practice/${w.topicId}`}
                    className="bg-cobalt text-white px-3 py-2 rounded text-xs font-medium"
                  >
                    Practise
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
