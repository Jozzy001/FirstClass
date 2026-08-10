import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { getCourse } from '../data/courseData.js'

export default function CourseTopics() {
  const { code } = useParams()
  const course = getCourse(code)

  if (!course) {
    return (
      <div className="max-w-[720px] mx-auto px-7 py-16 text-center">
        <p className="text-graphite/60">This course isn't loaded yet.</p>
        <Link to="/" className="text-cobalt font-medium">← Back home</Link>
      </div>
    )
  }

  return (
    <div className="max-w-[860px] mx-auto px-7 py-14">
      <div className="font-mono text-xs tracking-wider text-flame uppercase mb-3 font-medium">
        {course.faculty} · {course.creditUnits} units
      </div>
      <h1 className="font-display text-3xl font-semibold mb-2">{course.code}</h1>
      <p className="text-graphite/60 mb-10">{course.title}</p>

      <div className="space-y-3">
        {course.topics.map((topic, i) => (
          <div
            key={topic.id}
            className="bg-white border border-line rounded-lg p-5 flex items-center justify-between gap-4"
          >
            <div>
              <div className="font-mono text-xs text-cobalt-deep mb-1 flex items-center gap-2">
                Topic {i + 1}
                {!topic.isFree && (
                  <span className="bg-flame-pale text-flame px-1.5 py-0.5 rounded text-[10px] uppercase">
                    Premium
                  </span>
                )}
              </div>
              <div className="font-display text-[17px] font-semibold">{topic.title}</div>
              <div className="text-[12.5px] text-graphite/50 mt-1">
                {topic.questions.length} practice question{topic.questions.length === 1 ? '' : 's'}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Link
                to={`/course/${course.code}/read/${topic.id}`}
                className="border border-line px-4 py-2 rounded text-sm font-medium hover:border-cobalt"
              >
                Read
              </Link>
              <Link
                to={`/course/${course.code}/practice/${topic.id}`}
                className="bg-cobalt text-white px-4 py-2 rounded text-sm font-medium"
              >
                Practice
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
