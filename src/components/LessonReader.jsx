import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getLessonAnswers, markStudied, recordExercise } from '../lib/store.js'

// **bold** inside lesson text
function Rich({ text }) {
  const parts = String(text).split('**')
  return parts.map((p, i) => (i % 2 ? <strong key={i} className="font-semibold">{p}</strong> : <React.Fragment key={i}>{p}</React.Fragment>))
}

const LETTERS = 'ABCDE'

export default function LessonReader({ course, topic, lesson, prevTopic, nextTopic }) {
  const key = (s) => `${course.code}::${topic.id}::${s.id}`
  const [answers, setAnswers] = useState(() => getLessonAnswers())
  const isDone = (s, a = answers) => s.exercises.every((_, i) => (a[key(s)] || {})[i])

  const sections = lesson.sections
  const firstOpen = useMemo(() => {
    const i = sections.findIndex((s) => !isDone(s))
    return i === -1 ? 0 : i
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [idx, setIdx] = useState(firstOpen)
  const [hints, setHints] = useState({})
  const section = sections[idx]
  const done = isDone(section)
  const allDone = sections.every((s) => isDone(s))
  const rec = answers[key(section)] || {}
  const answeredCount = section.exercises.filter((_, i) => rec[i]).length

  useEffect(() => {
    markStudied(course.code, topic.id)
  }, [course.code, topic.id])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [idx])

  function choose(exIndex, choice) {
    if (rec[exIndex]) return
    const ok = choice === section.exercises[exIndex].correctIndex
    recordExercise(course.code, topic.id, section.id, exIndex, choice, ok)
    setAnswers(getLessonAnswers())
  }

  return (
    <div className="max-w-[780px] mx-auto px-4 sm:px-7 py-8">
      <div className="flex justify-between items-center text-xs text-graphite/50 mb-4">
        <Link to={`/course/${course.code}`} className="font-mono text-cobalt-deep">← {course.code}</Link>
        <span>{topic.title}</span>
      </div>

      {/* progress dots */}
      <div className="flex gap-1.5 mb-6" data-testid="lesson-dots">
        {sections.map((s, i) => {
          const reachable = i === 0 || sections.slice(0, i).every((x) => isDone(x))
          return (
            <button
              key={s.id}
              disabled={!reachable}
              onClick={() => setIdx(i)}
              aria-label={`Part ${i + 1}: ${s.title}`}
              className={`h-2 flex-1 rounded-sm ${isDone(s) ? 'bg-mint' : i === idx ? 'bg-cobalt' : 'bg-paper-2'} ${reachable ? '' : 'opacity-60'}`}
            />
          )
        })}
      </div>

      <div className="bg-white border border-line rounded-2xl overflow-hidden">
        <div className="bg-graphite text-white px-5 sm:px-8 py-3.5 text-[13px] flex justify-between">
          <span className="font-mono">Part {idx + 1} of {sections.length}</span>
          <span className="text-white/60">{done ? 'Completed' : `${answeredCount}/${section.exercises.length} exercises`}</span>
        </div>

        <div className="px-5 sm:px-10 py-8 sm:py-10">
          {idx === 0 && lesson.intro && (
            <p className="text-[14.5px] text-graphite/60 italic mb-6 leading-relaxed"><Rich text={lesson.intro} /></p>
          )}
          <h1 className="font-display text-xl sm:text-2xl font-semibold mb-5 -tracking-wide">{section.title}</h1>

          {section.body.map((p, i) => (
            <p key={i} className="text-[15.5px] leading-[1.75] text-graphite mb-4"><Rich text={p} /></p>
          ))}

          {section.keyPoints?.length > 0 && (
            <div className="bg-cobalt-pale border border-cobalt/15 rounded-lg px-5 py-4 my-6">
              <div className="font-mono text-[11px] text-cobalt-deep uppercase tracking-wide mb-2">Remember</div>
              <ul className="space-y-1.5">
                {section.keyPoints.map((k, i) => (
                  <li key={i} className="text-[14.5px] leading-relaxed flex gap-2"><span className="text-cobalt">•</span><span><Rich text={k} /></span></li>
                ))}
              </ul>
            </div>
          )}

          {section.example && (
            <div className="bg-paper-2 border border-line rounded-lg px-5 py-5 my-6" data-testid="worked-example">
              <div className="font-mono text-[11px] text-flame uppercase tracking-wide mb-2">Worked example</div>
              <p className="text-[15px] font-medium mb-3 leading-relaxed"><Rich text={section.example.problem} /></p>
              <ol className="space-y-2 mb-3">
                {section.example.steps.map((st, i) => (
                  <li key={i} className="text-[14.5px] leading-relaxed flex gap-2.5">
                    <span className="font-mono text-xs text-graphite/40 mt-0.5 shrink-0">{i + 1}.</span>
                    <span><Rich text={st} /></span>
                  </li>
                ))}
              </ol>
              <div className="text-[14.5px] font-semibold text-mint border-t border-line pt-3">Answer: <Rich text={section.example.answer} /></div>
            </div>
          )}

          {/* exercises */}
          <div className="mt-8 pt-6 border-t border-line" data-testid="exercises">
            <div className="font-mono text-[11px] text-cobalt uppercase tracking-wide mb-1">Try it yourself</div>
            <p className="text-xs text-graphite/55 mb-5">Answer each one to unlock the next part. You will see the full solution after you answer.</p>

            {section.exercises.map((ex, ei) => {
              const r = rec[ei]
              return (
                <div key={ei} className="mb-7 last:mb-0" data-testid={`exercise-${ei}`}>
                  <p className="text-[15px] font-medium mb-3 leading-relaxed whitespace-pre-wrap">{ei + 1}. <Rich text={ex.prompt} /></p>
                  <div className="space-y-2">
                    {ex.options.map((o, oi) => {
                      let cls = 'border-line bg-white hover:border-cobalt/60'
                      if (r) {
                        if (oi === ex.correctIndex) cls = 'border-mint bg-mint-pale'
                        else if (oi === r.c) cls = 'border-rose bg-rose-pale'
                        else cls = 'border-line bg-white opacity-60'
                      }
                      return (
                        <button
                          key={oi}
                          disabled={!!r}
                          onClick={() => choose(ei, oi)}
                          className={`w-full text-left border rounded-lg px-4 py-3 text-[14.5px] flex gap-3 transition-colors ${cls}`}
                        >
                          <span className="font-mono text-xs text-graphite/50 mt-0.5">{LETTERS[oi]}</span>
                          <span>{o}</span>
                        </button>
                      )
                    })}
                  </div>
                  {!r && ex.hint && (
                    <div className="mt-2.5">
                      {hints[`${section.id}-${ei}`] ? (
                        <p className="text-[13px] text-graphite/65 bg-flame-pale rounded px-3 py-2">Hint: <Rich text={ex.hint} /></p>
                      ) : (
                        <button onClick={() => setHints((h) => ({ ...h, [`${section.id}-${ei}`]: true }))} className="text-xs text-cobalt font-medium">Show a hint</button>
                      )}
                    </div>
                  )}
                  {r && (
                    <div className={`mt-3 rounded-lg px-4 py-3 text-[14px] leading-relaxed ${r.ok ? 'bg-mint-pale' : 'bg-rose-pale'}`}>
                      <div className={`font-semibold mb-1 ${r.ok ? 'text-mint' : 'text-rose'}`}>{r.ok ? 'Correct' : `Not quite. The answer is ${LETTERS[ex.correctIndex]}.`}</div>
                      <Rich text={ex.explanation} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* navigation */}
          <div className="flex items-center justify-between gap-3 mt-10 pt-6 border-t border-line">
            <button
              onClick={() => setIdx((i) => Math.max(0, i - 1))}
              disabled={idx === 0}
              className="text-sm font-medium text-cobalt-deep disabled:opacity-30"
            >
              ← Previous
            </button>
            {idx < sections.length - 1 ? (
              <button
                onClick={() => setIdx((i) => i + 1)}
                disabled={!done}
                data-testid="next-part"
                className="bg-cobalt text-white px-5 py-2.5 rounded font-medium text-sm disabled:opacity-40"
              >
                {done ? 'Next part →' : `Answer all ${section.exercises.length} to continue`}
              </button>
            ) : (
              <span className="text-xs text-graphite/50">{done ? 'Last part' : `Answer all ${section.exercises.length} to finish`}</span>
            )}
          </div>
        </div>
      </div>

      {allDone && (
        <div className="bg-graphite text-white rounded-2xl p-6 sm:p-8 mt-6" data-testid="topic-complete">
          <div className="font-mono text-[11px] text-flame uppercase tracking-wide mb-2">Topic complete</div>
          <div className="font-display text-xl font-semibold mb-3">You finished {topic.title}</div>
          {topic.keyFormula && (
            <div className="bg-white/10 rounded-lg px-4 py-3 mb-5">
              <div className="text-[11px] font-mono text-white/50 uppercase mb-1">Key formula</div>
              <div className="font-mono text-base">{topic.keyFormula}</div>
            </div>
          )}
          <p className="text-sm text-white/70 mb-5">Now try real past questions on this topic to lock it in.</p>
          <div className="flex gap-3 flex-wrap">
            <Link to={`/course/${course.code}/practice/${topic.id}`} className="bg-flame text-white px-5 py-2.5 rounded font-medium text-sm">Practise past questions</Link>
            {nextTopic && (
              <Link to={`/course/${course.code}/read/${nextTopic.id}`} className="border border-white/25 px-5 py-2.5 rounded font-medium text-sm">Next: {nextTopic.title} →</Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
