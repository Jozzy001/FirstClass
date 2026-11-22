import { getLesson, courseHasLessons } from './lessons.js'
import { getLessonAnswers, getStudied, getTopicStats } from './store.js'

/**
 * How far a student has gone in a course. Every topic is worth the same share of the bar.
 * - A topic with a lesson is split into its parts; a part is done once every exercise in it is answered.
 * - A topic with only short notes is done once its notes were opened or the topic practised.
 * Returns { done, total, pct, hasLessons, topics: { [topicId]: { done, total, state } }, nextTopic }
 * where done/total count whole topics and pct includes partly finished lessons.
 */
export function getCourseProgress(course) {
  const studied = getStudied()
  const answers = getLessonAnswers()
  const practised = new Set(getTopicStats().filter((t) => t.courseCode === course.code).map((t) => t.topicId))

  let doneTopics = 0
  let fractions = 0
  const topics = {}
  let nextTopic = null

  for (const topic of course.topics) {
    const lesson = getLesson(course.code, topic.id)
    let tDone = 0
    let tTotal = 0
    if (lesson) {
      for (const s of lesson.sections) {
        tTotal += 1
        const rec = answers[`${course.code}::${topic.id}::${s.id}`] || {}
        if (s.exercises.every((_, i) => rec[i])) tDone += 1
      }
    } else {
      tTotal = 1
      if (studied[`${course.code}::${topic.id}`] || practised.has(topic.id)) tDone = 1
    }
    fractions += tTotal ? tDone / tTotal : 0
    if (tDone >= tTotal) doneTopics += 1
    topics[topic.id] = {
      done: tDone,
      total: tTotal,
      lesson: !!lesson,
      state: tDone === 0 ? 'new' : tDone >= tTotal ? 'done' : 'partial'
    }
    if (!nextTopic && tDone < tTotal) nextTopic = topic
  }

  return {
    done: doneTopics,
    total: course.topics.length,
    pct: course.topics.length ? Math.round((fractions / course.topics.length) * 100) : 0,
    hasLessons: courseHasLessons(course.code),
    topics,
    nextTopic
  }
}
