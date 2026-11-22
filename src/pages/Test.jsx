import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getCourse } from '../data/courseData.js'
import { buildTest, scoreTest, TEST_MINUTES, TEST_SIZE } from '../lib/testEngine.js'
import { scoreToGrade } from '../lib/grading.js'
import { useCountUp } from '../lib/useMotion.js'
import { recordTest, saveDraft, loadDraft, clearDraft } from '../lib/store.js'

const LIMIT_MS = TEST_MINUTES * 60 * 1000

function formatClock(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export default function Test() {
  const { code } = useParams()
  const course = getCourse(code)

  // questions are looked up by id when resuming a saved test
  const questionIndex = useMemo(() => {
    const map = {}
    course?.topics.forEach((t) =>
      t.questions.forEach((q) => (map[q.id] = { ...q, topicId: t.id, topicTitle: t.title }))
    )
    return map
  }, [course])

  const [phase, setPhase] = useState('intro') // intro | running | done
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState([])
  const [flags, setFlags] = useState([])
  const [current, setCurrent] = useState(0)
  const [startedAt, setStartedAt] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [confirming, setConfirming] = useState(false)
  const [result, setResult] = useState(null)
  const [resumable, setResumable] = useState(null)
  const scoreShown = useCountUp(phase === 'done' && result ? result.score : 0, { duration: 1200 })
  const submittedRef = useRef(false)

  // offer to resume an unfinished test (refresh, locked phone, closed tab)
  useEffect(() => {
    if (!course) return
    const draft = loadDraft(course.code)
    if (draft && Array.isArray(draft.ids) && Date.now() - draft.startedAt < LIMIT_MS) {
      const qs = draft.ids.map((id) => questionIndex[id]).filter(Boolean)
      if (qs.length === draft.ids.length) setResumable({ draft, qs })
      else clearDraft(course.code)
    } else if (draft) {
      clearDraft(course.code)
    }
  }, [course, questionIndex])

  // countdown
  useEffect(() => {
    if (phase !== 'running') return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [phase])

  const remaining = phase === 'running' ? LIMIT_MS - (now - startedAt) : LIMIT_MS

  // time up: submit whatever has been answered
  useEffect(() => {
    if (phase === 'running' && remaining <= 0) submit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, remaining])

  // keep the draft current
  useEffect(() => {
    if (phase !== 'running' || !course) return
    saveDraft(course.code, { ids: questions.map((q) => q.id), answers, flags, current, startedAt })
  }, [phase, course, questions, answers, flags, current, startedAt])

  if (!course) {
    return (
      <div className="max-w-[720px] mx-auto px-5 sm:px-7 py-16 text-center">
        <p className="text-graphite/60">This course isn't loaded yet.</p>
        <Link to="/" className="text-cobalt font-medium">← Back home</Link>
      </div>
    )
  }

  const totalAvailable = course.topics.reduce((s, t) => s + t.questions.length, 0)

  if (totalAvailable < 10) {
    return (
      <div className="max-w-[640px] mx-auto px-5 sm:px-7 py-16 text-center">
        <p className="text-graphite/60 mb-4">
          {course.code} doesn't have enough verified questions for a test yet.
        </p>
        <Link to={`/course/${course.code}`} className="text-cobalt font-medium">← Back to {course.code}</Link>
      </div>
    )
  }

  function start() {
    const qs = buildTest(course)
    submittedRef.current = false
    setQuestions(qs)
    setAnswers(new Array(qs.length).fill(null))
    setFlags(new Array(qs.length).fill(false))
    setCurrent(0)
    setConfirming(false)
    setStartedAt(Date.now())
    setNow(Date.now())
    setPhase('running')
  }

  function resume() {
    const { draft, qs } = resumable
    submittedRef.current = false
    setQuestions(qs)
    setAnswers(draft.answers)
    setFlags(draft.flags || new Array(qs.length).fill(false))
    setCurrent(Math.min(draft.current || 0, qs.length - 1))
    setStartedAt(draft.startedAt)
    setNow(Date.now())
    setConfirming(false)
    setResumable(null)
    setPhase('running')
  }

  function submit() {
    if (submittedRef.current) return
    submittedRef.current = true
    const scored = scoreTest(questions, answers)
    const durationSec = Math.min(TEST_MINUTES * 60, Math.round((Date.now() - startedAt) / 1000))
    recordTest({
      courseCode: course.code,
      score: scored.score,
      correct: scored.correct,
      total: scored.total,
      durationSec,
      topicResults: scored.topicResults
    })
    clearDraft(course.code)
    setResult(scored)
    setPhase('done')
  }

  // ---------- intro ----------
  if (phase === 'intro') {
    const size = Math.min(TEST_SIZE, totalAvailable)
    return (
      <div className="max-w-[600px] mx-auto px-5 sm:px-7 py-12 sm:py-16">
        <div className="font-mono text-xs tracking-wider text-flame uppercase mb-3 font-medium">
          {course.code} · Course test
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-2">{course.title}</h1>
        <p className="text-graphite/60 mb-8">
          A test across every topic in the course, scored out of 100. Your result goes onto your
          result slip and counts toward your CGPA.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            [size, 'questions'],
            [TEST_MINUTES, 'minutes'],
            ['100', 'marks']
          ].map(([v, l]) => (
            <div key={l} className="bg-white border border-line rounded-lg p-4 text-center">
              <div className="font-display text-2xl font-semibold">{v}</div>
              <div className="text-xs text-graphite/50 mt-1">{l}</div>
            </div>
          ))}
        </div>

        <ul className="text-sm text-graphite/70 space-y-2 mb-8 list-disc pl-5">
          <li>No answers are shown until you submit, like a real exam.</li>
          <li>You can move between questions and flag the ones you want to revisit.</li>
          <li>The timer keeps running if you leave. Your progress is saved on this device.</li>
          <li>Each attempt uses a fresh mix of questions. Your latest score is the one that counts.</li>
        </ul>

        {resumable && (
          <div className="bg-flame-pale border border-flame/30 rounded-lg p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <strong>You have an unfinished test.</strong>{' '}
              <span className="text-graphite/70">
                {formatClock(LIMIT_MS - (Date.now() - resumable.draft.startedAt))} left.
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={resume} className="bg-flame text-white px-4 py-2 rounded text-sm font-medium">
                Resume
              </button>
              <button
                onClick={() => { clearDraft(course.code); setResumable(null) }}
                className="border border-line bg-white px-4 py-2 rounded text-sm font-medium"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        <button onClick={start} className="press w-full bg-cobalt text-white py-3.5 rounded font-medium">
          Start test
        </button>
        <Link to={`/course/${course.code}`} className="block text-center text-sm text-graphite/50 mt-2 py-3">
          ← Back to {course.code}
        </Link>
      </div>
    )
  }

  // ---------- result ----------
  if (phase === 'done' && result) {
    const grade = scoreToGrade(result.score)
    const gradeColor = grade.point >= 4 ? 'text-mint' : grade.point >= 2 ? 'text-cobalt' : 'text-rose'
    return (
      <div className="max-w-[760px] mx-auto px-5 sm:px-7 py-12 sm:py-16">
        <div className="text-center mb-10">
          <div className="font-mono text-xs tracking-wider text-flame uppercase mb-4">
            {course.code} · Test complete
          </div>
          <div className="font-display text-7xl font-bold leading-none num">
            {scoreShown}
            <span className="text-2xl text-graphite/40">/100</span>
          </div>
          <div className={`font-display text-xl font-semibold mt-3 ${gradeColor}`}>
            Grade <span className="stamp font-semibold" style={{ '--d': '1.4s' }}>{grade.letter}</span> · {grade.point}.0 points
          </div>
          <p className="text-graphite/60 mt-2 text-sm">
            {result.correct} of {result.total} correct
            {result.wrong.some((w) => w.chosen === null) &&
              ` · ${result.wrong.filter((w) => w.chosen === null).length} left unanswered`}
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-7">
            <Link to="/results" className="bg-cobalt text-white px-5 py-2.5 rounded font-medium text-sm">
              View result slip
            </Link>
            <button onClick={start} className="border border-line bg-white px-5 py-2.5 rounded font-medium text-sm">
              Retake
            </button>
            <Link to={`/course/${course.code}`} className="border border-line bg-white px-5 py-2.5 rounded font-medium text-sm">
              Back to {course.code}
            </Link>
          </div>
        </div>

        <h2 className="font-display text-lg font-semibold mb-3">By topic</h2>
        <div className="space-y-2 mb-10">
          {[...result.topicResults]
            .sort((a, b) => a.correct / a.total - b.correct / b.total)
            .map((t) => {
              const pct = Math.round((t.correct / t.total) * 100)
              return (
                <div key={t.topicId} className="bg-white border border-line rounded-lg px-4 py-3">
                  <div className="flex justify-between gap-3 text-sm mb-2">
                    <span className="font-medium">{t.topicTitle}</span>
                    <span className="font-mono text-graphite/60 flex-shrink-0">
                      {t.correct}/{t.total} · {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded bg-paper-2 overflow-hidden">
                    <div
                      className={`h-full ${pct >= 60 ? 'bg-mint' : 'bg-rose'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {pct < 60 && (
                    <Link
                      to={`/course/${course.code}/practice/${t.topicId}`}
                      className="text-xs text-cobalt font-medium mt-2 inline-block"
                    >
                      Practise this topic →
                    </Link>
                  )}
                </div>
              )
            })}
        </div>

        {result.wrong.length > 0 && (
          <>
            <h2 className="font-display text-lg font-semibold mb-3">
              Review · {result.wrong.length} to learn from
            </h2>
            <div className="space-y-3">
              {result.wrong.map(({ question, chosen }) => (
                <div key={question.id} className="bg-white border border-line rounded-lg p-5">
                  <div className="font-mono text-[11px] text-cobalt-deep mb-2">{question.topicTitle}</div>
                  <div className="text-[15px] font-medium mb-3 whitespace-pre-wrap">{question.prompt}</div>
                  <div className="text-sm space-y-1.5">
                    <div className="rounded px-3 py-2 bg-mint-pale">
                      <span className="font-mono text-xs mr-2">{String.fromCharCode(65 + question.correctIndex)}</span>
                      {question.options[question.correctIndex]}
                      <span className="text-mint font-medium ml-2">correct</span>
                    </div>
                    <div className="rounded px-3 py-2 bg-rose-pale">
                      {chosen === null ? (
                        <span className="text-rose font-medium">Not answered</span>
                      ) : (
                        <>
                          <span className="font-mono text-xs mr-2">{String.fromCharCode(65 + chosen)}</span>
                          {question.options[chosen]}
                          <span className="text-rose font-medium ml-2">your answer</span>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-[13.5px] text-graphite/70 mt-3">{question.explanation}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  // ---------- running ----------
  const q = questions[current]
  const answeredCount = answers.filter((a) => a !== null).length
  const unanswered = questions.length - answeredCount
  const low = remaining < 5 * 60 * 1000

  function choose(i) {
    setAnswers((prev) => prev.map((a, idx) => (idx === current ? i : a)))
  }
  function toggleFlag() {
    setFlags((prev) => prev.map((f, idx) => (idx === current ? !f : f)))
  }

  return (
    <div className="max-w-[760px] mx-auto px-5 sm:px-7 py-6 sm:py-10">
      <div className="sticky top-14 z-10 bg-paper/95 backdrop-blur py-3 -mx-5 px-5 sm:mx-0 sm:px-0 mb-4 flex items-center justify-between border-b border-line">
        <div className="font-mono text-xs text-graphite/60">
          {course.code} · {current + 1}/{questions.length} · {answeredCount} answered
        </div>
        <div className={`font-mono text-sm font-medium px-3 py-1 rounded ${low ? 'bg-rose-pale text-rose urgent' : 'bg-paper-2 text-graphite'}`}>
          {formatClock(remaining)}
        </div>
      </div>

      <div className="bg-white border border-line rounded-2xl p-5 sm:p-8">
        <div className="flex justify-between items-start gap-3 mb-5">
          <div className="font-display text-base sm:text-lg font-semibold leading-relaxed whitespace-pre-wrap">{q.prompt}</div>
          <button
            onClick={toggleFlag}
            aria-pressed={flags[current]}
            className={`text-xs px-2.5 py-1 rounded border flex-shrink-0 ${flags[current] ? 'bg-flame-pale border-flame text-flame font-medium' : 'border-line text-graphite/60'}`}
          >
            {flags[current] ? 'Flagged' : 'Flag'}
          </button>
        </div>

        <div className="space-y-2.5">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => choose(i)}
              className={`w-full flex items-center gap-3.5 border rounded-lg px-4 py-3 text-left text-sm transition-colors ${
                answers[current] === i ? 'border-cobalt bg-cobalt-pale' : 'border-line hover:border-cobalt'
              }`}
            >
              <span
                className={`w-6 h-6 rounded flex items-center justify-center font-mono text-xs border flex-shrink-0 ${
                  answers[current] === i ? 'bg-cobalt text-white border-cobalt' : 'border-line'
                }`}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span>{opt}</span>
            </button>
          ))}
        </div>

        <div className="flex justify-between gap-3 mt-6">
          <button
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            className="border border-line px-5 py-2.5 rounded text-sm font-medium disabled:opacity-30"
          >
            Previous
          </button>
          {current + 1 < questions.length ? (
            <button
              onClick={() => setCurrent((c) => c + 1)}
              className="bg-cobalt text-white px-5 py-2.5 rounded text-sm font-medium"
            >
              Next
            </button>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="bg-flame text-white px-5 py-2.5 rounded text-sm font-medium"
            >
              Finish
            </button>
          )}
        </div>
      </div>

      <div className="mt-6">
        <div className="text-xs text-graphite/50 mb-2">Jump to a question</div>
        <div className="flex flex-wrap gap-1.5">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Question ${i + 1}${answers[i] !== null ? ', answered' : ''}${flags[i] ? ', flagged' : ''}`}
              className={`w-9 h-9 rounded font-mono text-xs border relative ${
                i === current
                  ? 'border-graphite bg-graphite text-white'
                  : answers[i] !== null
                  ? 'border-cobalt bg-cobalt-pale text-cobalt-deep'
                  : 'border-line bg-white text-graphite/60'
              }`}
            >
              {i + 1}
              {flags[i] && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-flame" />}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={() => setConfirming(true)}
          className="text-sm text-graphite/60 underline underline-offset-4"
        >
          Submit test
        </button>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-20 bg-graphite/50 flex items-center justify-center px-5" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl p-6 max-w-[400px] w-full">
            <div className="font-display text-lg font-semibold mb-2">Submit your test?</div>
            <p className="text-sm text-graphite/70 mb-5">
              {unanswered > 0
                ? `You have ${unanswered} unanswered question${unanswered === 1 ? '' : 's'}. They will be marked wrong.`
                : 'All questions answered.'}
              {flags.some(Boolean) && ` ${flags.filter(Boolean).length} flagged for review.`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirming(false)} className="flex-1 border border-line py-2.5 rounded text-sm font-medium">
                Keep going
              </button>
              <button onClick={submit} className="flex-1 bg-cobalt text-white py-2.5 rounded text-sm font-medium">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
