import phy101Notes from './phy101_notes.json'
import phy101Questions from './phy101_questions.json'
import phy103Notes from './phy103_notes.json'
import phy103Questions from './phy103_questions.json'
import phy104Notes from './phy104_notes.json'
import phy104Questions from './phy104_questions.json'

// Content is bundled directly in the app — no database read needed to
// browse notes or take quizzes. User accounts, scores, streaks, and CGPA
// still live in Firestore (src/lib/firebase.js), since there's no static
// alternative for per-student data that changes. This file only covers
// the read-mostly course content.
function buildCourseTopics(notesData, questionsData) {
  const notesByTopic = Object.fromEntries(notesData.topics.map((t) => [t.id, t]))
  const questionsByTopic = Object.fromEntries(
    questionsData.topics.map((t) => [t.id, t])
  )

  const allTopicIds = notesData.topics.map((t) => t.id)

  return allTopicIds.map((id, index) => {
    const note = notesByTopic[id]
    const qTopic = questionsByTopic[id]
    return {
      id,
      title: note.title,
      notes: note.notes,
      keyFormula: note.keyFormula,
      isFree: index === 0, // first topic free, matches the freemium model
      questions: qTopic ? qTopic.questions.filter((q) => !q.needsReview) : []
    }
  })
}

const courses = {
  PHY101: {
    code: 'PHY101',
    title: 'Elementary/General Physics I',
    faculty: 'Sciences',
    creditUnits: 2,
    topics: buildCourseTopics(phy101Notes, phy101Questions)
  },
  PHY103: {
    code: 'PHY103',
    title: 'General Physics III — Thermal Physics & Properties of Matter',
    faculty: 'Sciences',
    creditUnits: 2,
    topics: buildCourseTopics(phy103Notes, phy103Questions)
  },
  PHY104: {
    code: 'PHY104',
    title: 'General Physics IV — Vibrations, Waves & Optics',
    faculty: 'Sciences',
    creditUnits: 2,
    topics: buildCourseTopics(phy104Notes, phy104Questions)
  }
}

export function getCourse(code) {
  return courses[code] || null
}

export function getAllCourses() {
  return Object.values(courses)
}
