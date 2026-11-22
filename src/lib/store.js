// Local-first storage for a student's results.
//
// Everything a student does (practice runs, course tests) is saved on their
// own device first, so scores, CGPA and weak topics work immediately and
// offline, with or without a signed-in account. A Firestore sync can be
// layered on top later without touching any screen: every screen reads
// through the functions below, never through localStorage directly.
//
// Every localStorage access is wrapped: private windows, blocked storage or
// a full disk must never crash the app. If storage is unavailable we fall
// back to memory for the current session.

const BASE_KEY = 'fc_attempts_v1'
const STUDIED_KEY = 'fc_studied_v1'
const LESSON_KEY = 'fc_lessons_v1'
const BASE_DRAFT_PREFIX = 'fc_test_draft_v1_'
const RECENT_PER_TOPIC = 5 // weak-topic accuracy looks at the latest N runs per topic

let memory = null // used only when localStorage is unavailable
let scope = 'guest' // results belong to the signed-in account, so two students on one phone never mix

/** Called by the auth layer whenever the signed-in student changes. */
export function setStoreUser(uid) {
  scope = uid || 'guest'
  memory = null
}

const suffix = () => (scope === 'guest' ? '' : `_${scope}`)
const KEY_NOW = () => BASE_KEY + suffix()
const DRAFT_NOW = () => BASE_DRAFT_PREFIX + (scope === 'guest' ? '' : `${scope}_`)

function emptyStore() {
  return { tests: [], topics: [] }
}

function read() {
  try {
    const raw = window.localStorage.getItem(KEY_NOW())
    if (!raw) return memory || emptyStore()
    const data = JSON.parse(raw)
    if (data && Array.isArray(data.tests) && Array.isArray(data.topics)) return data
    return emptyStore()
  } catch {
    return memory || emptyStore()
  }
}

function write(data) {
  memory = data
  try {
    window.localStorage.setItem(KEY_NOW(), JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

/** A finished topic practice run. */
export function recordTopicPractice({ courseCode, topicId, topicTitle, correct, total }) {
  if (!total) return
  const data = read()
  data.topics.push({
    courseCode,
    topicId,
    topicTitle,
    correct,
    total,
    source: 'practice',
    takenAt: new Date().toISOString()
  })
  write(data)
}

/**
 * A finished course test.
 * { courseCode, score (0-100), correct, total, durationSec, topicResults:[{topicId, topicTitle, correct, total}] }
 */
export function recordTest(attempt) {
  const data = read()
  const takenAt = new Date().toISOString()
  data.tests.push({ ...attempt, takenAt })
  for (const t of attempt.topicResults || []) {
    if (!t.total) continue
    data.topics.push({
      courseCode: attempt.courseCode,
      topicId: t.topicId,
      topicTitle: t.topicTitle,
      correct: t.correct,
      total: t.total,
      source: 'test',
      takenAt
    })
  }
  write(data)
}

export function getTests(courseCode) {
  const all = read().tests
  return courseCode ? all.filter((t) => t.courseCode === courseCode) : all
}

/** Map of courseCode -> { latest, best, attempts } for every course that has been tested. */
export function getCourseScores() {
  const byCourse = {}
  for (const t of read().tests) {
    const entry = (byCourse[t.courseCode] ||= { latest: null, best: null, attempts: 0 })
    entry.attempts += 1
    if (!entry.latest || t.takenAt >= entry.latest.takenAt) entry.latest = t
    if (!entry.best || t.score > entry.best.score) entry.best = t
  }
  return byCourse
}

/**
 * Per-topic accuracy built from the latest few runs of each topic (practice
 * and tests together), so a topic stops being "weak" once the student
 * actually improves on it.
 * Returns [{ courseCode, topicId, topicName, correct, total }]
 */
export function getTopicStats() {
  const groups = {}
  for (const r of read().topics) {
    ;(groups[`${r.courseCode}::${r.topicId}`] ||= []).push(r)
  }
  return Object.values(groups).map((runs) => {
    runs.sort((a, b) => (a.takenAt < b.takenAt ? -1 : 1))
    const recent = runs.slice(-RECENT_PER_TOPIC)
    return {
      courseCode: recent[0].courseCode,
      topicId: recent[0].topicId,
      topicName: recent[recent.length - 1].topicTitle,
      correct: recent.reduce((s, r) => s + r.correct, 0),
      total: recent.reduce((s, r) => s + r.total, 0)
    }
  })
}

// ----- in-progress test (survives refresh / phone locking / tab kill) -----

export function saveDraft(courseCode, draft) {
  try {
    window.localStorage.setItem(DRAFT_NOW() + courseCode, JSON.stringify(draft))
  } catch {
    /* non-fatal: the test still works, it just can't be resumed after a reload */
  }
}

export function loadDraft(courseCode) {
  try {
    const raw = window.localStorage.getItem(DRAFT_NOW() + courseCode)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearDraft(courseCode) {
  try {
    window.localStorage.removeItem(DRAFT_NOW() + courseCode)
  } catch {
    /* ignore */
  }
}

// ----- reading progress and daily activity (for the dashboard) -----

function readStudied() {
  try {
    const raw = window.localStorage.getItem(STUDIED_KEY + suffix())
    const data = raw ? JSON.parse(raw) : {}
    return data && typeof data === 'object' ? data : {}
  } catch {
    return {}
  }
}

/** Record that the student opened a topic's notes. */
export function markStudied(courseCode, topicId) {
  const data = readStudied()
  data[`${courseCode}::${topicId}`] = new Date().toISOString()
  try {
    window.localStorage.setItem(STUDIED_KEY + suffix(), JSON.stringify(data))
  } catch {
    /* non-fatal */
  }
}

/** Map of "COURSE::topicId" -> ISO time the notes were last opened. */
export function getStudied() {
  return readStudied()
}

/** Local calendar day as YYYY-MM-DD. */
export function dayKey(date) {
  const d = date instanceof Date ? date : new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Everything the dashboard needs about what the student did and when.
 * - days: Set of days with any activity (reading, practice or a test)
 * - answeredByDay: questions answered per day
 * - last: the most recent topic touched { courseCode, topicId, kind, at }
 */
export function getActivity() {
  const data = read()
  const days = new Set()
  const answeredByDay = {}
  let last = null
  const touch = (courseCode, topicId, kind, at) => {
    if (!last || at > last.at) last = { courseCode, topicId, kind, at }
  }
  for (const r of data.topics) {
    const k = dayKey(r.takenAt)
    days.add(k)
    answeredByDay[k] = (answeredByDay[k] || 0) + (r.total || 0)
    touch(r.courseCode, r.topicId, 'practice', r.takenAt)
  }
  for (const [key, at] of Object.entries(readStudied())) {
    days.add(dayKey(at))
    const [courseCode, topicId] = key.split('::')
    touch(courseCode, topicId, 'read', at)
  }
  for (const [key, rec] of Object.entries(readLessons())) {
    if (!rec.at) continue
    days.add(dayKey(rec.at))
    const [courseCode, topicId] = key.split('::')
    touch(courseCode, topicId, 'read', rec.at)
  }
  for (const t of data.tests) days.add(dayKey(t.takenAt))
  return { days, answeredByDay, last }
}

/** Consecutive active days ending today (or yesterday, so the streak survives until tonight). */
export function computeStreak(days) {
  const cursor = new Date()
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (days.has(dayKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

// ----- lesson exercises -----
// Stored as { "COURSE::topic::section": { "0": { c: chosenIndex, ok: true }, "1": {...}, at } }

function readLessons() {
  try {
    const raw = window.localStorage.getItem(LESSON_KEY + suffix())
    const data = raw ? JSON.parse(raw) : {}
    return data && typeof data === 'object' ? data : {}
  } catch {
    return {}
  }
}

export function getLessonAnswers() {
  return readLessons()
}

/** Save the first answer given to a lesson exercise (later taps never change it). */
export function recordExercise(courseCode, topicId, sectionId, index, choice, ok) {
  const data = readLessons()
  const key = `${courseCode}::${topicId}::${sectionId}`
  const rec = (data[key] ||= {})
  if (rec[index]) return
  rec[index] = { c: choice, ok }
  rec.at = new Date().toISOString()
  try {
    window.localStorage.setItem(LESSON_KEY + suffix(), JSON.stringify(data))
  } catch {
    /* non-fatal */
  }
}
