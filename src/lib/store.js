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

const KEY = 'fc_attempts_v1'
const DRAFT_PREFIX = 'fc_test_draft_v1_'
const RECENT_PER_TOPIC = 5 // weak-topic accuracy looks at the latest N runs per topic

let memory = null // used only when localStorage is unavailable

function emptyStore() {
  return { tests: [], topics: [] }
}

function read() {
  try {
    const raw = window.localStorage.getItem(KEY)
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
    window.localStorage.setItem(KEY, JSON.stringify(data))
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
    window.localStorage.setItem(DRAFT_PREFIX + courseCode, JSON.stringify(draft))
  } catch {
    /* non-fatal: the test still works, it just can't be resumed after a reload */
  }
}

export function loadDraft(courseCode) {
  try {
    const raw = window.localStorage.getItem(DRAFT_PREFIX + courseCode)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearDraft(courseCode) {
  try {
    window.localStorage.removeItem(DRAFT_PREFIX + courseCode)
  } catch {
    /* ignore */
  }
}
