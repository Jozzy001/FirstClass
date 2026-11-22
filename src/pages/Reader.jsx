import React, { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getCourse } from '../data/courseData.js'
import { markStudied } from '../lib/store.js'
import { getLesson } from '../lib/lessons.js'
import LessonReader from '../components/LessonReader.jsx'

export default function Reader() {
  const { code, topicId } = useParams()
  const course = getCourse(code)
  const topicIndex = course?.topics.findIndex((t) => t.id === topicId) ?? -1
  const topic = topicIndex >= 0 ? course.topics[topicIndex] : null

  useEffect(() => {
    if (course && topic) markStudied(course.code, topic.id)
  }, [course?.code, topic?.id])

  if (!course || !topic) {
    return (
      <div className="max-w-[720px] mx-auto px-7 py-16 text-center">
        <p className="text-graphite/60">Topic not found.</p>
        <Link to="/" className="text-cobalt font-medium">← Back home</Link>
      </div>
    )
  }

  const prevTopic = topicIndex > 0 ? course.topics[topicIndex - 1] : null
  const nextTopic = topicIndex < course.topics.length - 1 ? course.topics[topicIndex + 1] : null

  const lesson = getLesson(course.code, topic.id)
  if (lesson) {
    return <LessonReader key={topic.id} course={course} topic={topic} lesson={lesson} prevTopic={prevTopic} nextTopic={nextTopic} />
  }

  const paragraphs = topic.notes.split('\n\n').filter((p) => !p.startsWith('KEY FORMULA'))

  return (
    <div className="max-w-[820px] mx-auto px-7 py-10">
      <div className="flex justify-between items-center text-xs text-graphite/50 mb-6">
        <Link to={`/course/${course.code}`} className="font-mono text-cobalt-deep inline-block py-2.5 pr-3">
          ← {course.code}
        </Link>
        <span>Topic {topicIndex + 1} of {course.topics.length}</span>
      </div>

      <div className="bg-white border border-line rounded-2xl overflow-hidden">
        <div className="bg-graphite text-white px-8 py-4 text-[13px] flex justify-between">
          <span className="font-mono">{course.code}</span>
          <span className="text-white/60">{topic.title}</span>
        </div>

        <div className="px-8 md:px-11 py-10">
          <h1 className="font-display text-2xl md:text-3xl font-semibold mb-6">{topic.title}</h1>

          {paragraphs.map((p, i) => (
            <p key={i} className="text-[15.5px] leading-relaxed text-graphite mb-5">
              {p}
            </p>
          ))}

          {topic.keyFormula && (
            <div className="bg-graphite text-white rounded-lg px-6 py-5 my-8">
              <div className="text-flame text-[11px] font-mono uppercase tracking-wide mb-2">
                Key formula
              </div>
              <div className="font-mono text-lg">{topic.keyFormula}</div>
            </div>
          )}

          <div className="flex justify-between items-center pt-6 mt-4 border-t border-line">
            {prevTopic ? (
              <Link
                to={`/course/${course.code}/read/${prevTopic.id}`}
                className="press text-sm text-cobalt-deep font-medium py-2.5"
              >
                ← {prevTopic.title}
              </Link>
            ) : <span />}
            <Link
              to={`/course/${course.code}/practice/${topic.id}`}
              className="press bg-cobalt text-white px-5 py-3 rounded font-medium text-sm"
            >
              Practice this topic
            </Link>
            {nextTopic ? (
              <Link
                to={`/course/${course.code}/read/${nextTopic.id}`}
                className="press text-sm text-cobalt-deep font-medium py-2.5"
              >
                {nextTopic.title} →
              </Link>
            ) : <span />}
          </div>
        </div>
      </div>
    </div>
  )
}
