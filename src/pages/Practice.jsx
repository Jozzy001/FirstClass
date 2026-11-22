import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getCourse } from '../data/courseData.js'
import { recordTopicPractice } from '../lib/store.js'
import { useCountUp } from '../lib/useMotion.js'

export default function Practice() {
  const { code, topicId } = useParams()
  const course = getCourse(code)
  const topic = course?.topics.find((t) => t.id === topicId)

  const [qIndex, setQIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [finished, setFinished] = useState(false)
  const percentShown = useCountUp(finished && topic?.questions.length ? Math.round((correctCount / topic.questions.length) * 100) : 0, { duration: 1000 })

  if (!course || !topic) {
    return (
      <div className="max-w-[720px] mx-auto px-7 py-16 text-center">
        <p className="text-graphite/60">Topic not found.</p>
        <Link to="/" className="text-cobalt font-medium">← Back home</Link>
      </div>
    )
  }

  if (topic.questions.length === 0) {
    return (
      <div className="max-w-[640px] mx-auto px-7 py-16 text-center">
        <p className="text-graphite/60 mb-4">No verified practice questions for this topic yet.</p>
        <Link to={`/course/${course.code}`} className="text-cobalt font-medium">← Back to {course.code}</Link>
      </div>
    )
  }

  const question = topic.questions[qIndex]

  function handleSelect(idx) {
    if (selected !== null) return
    setSelected(idx)
    if (idx === question.correctIndex) setCorrectCount((c) => c + 1)
  }

  function handleNext() {
    if (qIndex + 1 < topic.questions.length) {
      setQIndex((i) => i + 1)
      setSelected(null)
    } else {
      recordTopicPractice({
        courseCode: course.code,
        topicId: topic.id,
        topicTitle: topic.title,
        correct: correctCount,
        total: topic.questions.length
      })
      setFinished(true)
    }
  }

  if (finished) {
    const percent = Math.round((correctCount / topic.questions.length) * 100)
    return (
      <div className="max-w-[560px] mx-auto px-7 py-20 text-center">
        <div className="font-mono text-xs tracking-wider text-flame uppercase mb-4">
          {topic.title} · Complete
        </div>
        <div className="font-display text-6xl font-bold mb-2 num">{percentShown}%</div>
        <p className="text-graphite/60 mb-8">
          {correctCount} of {topic.questions.length} correct
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            to={`/course/${course.code}`}
            className="border border-line px-5 py-2.5 rounded font-medium text-sm"
          >
            Back to {course.code}
          </Link>
          <button
            onClick={() => { setQIndex(0); setSelected(null); setCorrectCount(0); setFinished(false) }}
            className="bg-cobalt text-white px-5 py-2.5 rounded font-medium text-sm"
          >
            Retake
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[640px] mx-auto px-7 py-14">
      <div className="flex justify-between items-center text-xs text-graphite/50 mb-6">
        <span className="font-mono">{course.code} · {topic.title}</span>
        <span>Question {qIndex + 1} of {topic.questions.length}</span>
      </div>

      <div className="bg-white border border-line rounded-2xl p-8">
        <div className="font-display text-lg font-semibold mb-6 leading-relaxed whitespace-pre-wrap">
          {question.prompt}
        </div>

        <div className="space-y-2.5">
          {question.options.map((opt, i) => {
            const isCorrect = i === question.correctIndex
            const isSelected = i === selected
            let cls = 'border-line hover:border-cobalt'
            if (selected !== null && isCorrect) cls = 'border-mint bg-mint-pale'
            else if (selected !== null && isSelected) cls = 'border-rose bg-rose-pale'

            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                className={`press w-full flex items-center gap-3.5 border rounded-lg px-4 py-3.5 text-left text-sm transition-colors ${cls} ${selected !== null && isSelected && !isCorrect ? 'shake' : ''}`}
              >
                <span className="w-6 h-6 rounded flex items-center justify-center font-mono text-xs border border-line flex-shrink-0">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1">{opt}</span>
                {selected !== null && isCorrect && <span className="text-mint font-bold pop-now" aria-hidden="true">✓</span>}
                {selected !== null && isSelected && !isCorrect && <span className="text-rose font-bold" aria-hidden="true">✗</span>}
              </button>
            )
          })}
        </div>

        {selected !== null && (
          <div className="feedback-in mt-5 bg-paper-2 rounded-lg px-5 py-4 text-[13.5px] text-graphite/70">
            <strong className="text-graphite">
              {selected === question.correctIndex ? 'Correct. ' : 'Not quite. '}
            </strong>
            {question.explanation}
          </div>
        )}

        {selected !== null && (
          <button
            onClick={handleNext}
            className="press mt-5 w-full bg-cobalt text-white py-3.5 rounded font-medium text-sm"
          >
            {qIndex + 1 < topic.questions.length ? 'Next question' : 'See results'}
          </button>
        )}
      </div>
    </div>
  )
}
