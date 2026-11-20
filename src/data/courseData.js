import phy101Notes from './phy101_notes.json'
import phy101Questions from './phy101_questions.json'
import phy103Notes from './phy103_notes.json'
import phy103Questions from './phy103_questions.json'
import phy104Notes from './phy104_notes.json'
import phy104Questions from './phy104_questions.json'
import chm101Notes from './chm101_notes.json'
import chm101Questions from './chm101_questions.json'
import chm107Notes from './chm107_notes.json'
import chm107Questions from './chm107_questions.json'
import mth101Notes from './mth101_notes.json'
import mth101Questions from './mth101_questions.json'
import mth103Notes from './mth103_notes.json'
import mth103Questions from './mth103_questions.json'
import bot101Notes from './bot101_notes.json'
import bot101Questions from './bot101_questions.json'
import bio101Notes from './bio101_notes.json'
import bio101Questions from './bio101_questions.json'

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
  },
  CHM101: {
    code: 'CHM101',
    title: 'General Chemistry I',
    faculty: 'Sciences',
    creditUnits: 2,
    topics: buildCourseTopics(chm101Notes, chm101Questions)
  },
  CHM107: {
    code: 'CHM107',
    title: 'Chemistry Practical',
    faculty: 'Sciences',
    // creditUnits intentionally not set yet: excluded from CGPA until supplied
    topics: buildCourseTopics(chm107Notes, chm107Questions)
  },
  MTH101: {
    code: 'MTH101',
    title: 'Algebra and Trigonometry',
    faculty: 'Sciences',
    // creditUnits intentionally not set yet: excluded from CGPA until supplied
    topics: buildCourseTopics(mth101Notes, mth101Questions)
  },
  MTH103: {
    code: 'MTH103',
    title: 'Vectors, Geometry and Dynamics',
    faculty: 'Sciences',
    // creditUnits intentionally not set yet: excluded from CGPA until supplied
    topics: buildCourseTopics(mth103Notes, mth103Questions)
  },
  BOT101: {
    code: 'BOT101',
    title: 'Introduction to Plant Biology I',
    faculty: 'Sciences',
    // title is a placeholder; creditUnits intentionally not set yet
    topics: buildCourseTopics(bot101Notes, bot101Questions)
  },
  BIO101: {
    code: 'BIO101',
    title: 'Introductory Biology',
    faculty: 'Sciences',
    // title is a placeholder; creditUnits intentionally not set yet
    topics: buildCourseTopics(bio101Notes, bio101Questions)
  }
}

export function getCourse(code) {
  return courses[code] || null
}

export function getAllCourses() {
  return Object.values(courses)
}
