// Step-by-step lessons live in src/data/<course>_lessons.json. Adding a file there is enough:
// it is picked up automatically, and topics without a lesson fall back to the short notes.
const files = import.meta.glob('../data/*_lessons.json', { eager: true })

const byCourse = {}
for (const mod of Object.values(files)) {
  const data = mod.default || mod
  const map = {}
  for (const t of data.topics || []) map[t.id] = t
  byCourse[data.courseCode] = map
}

export function getLesson(courseCode, topicId) {
  return byCourse[courseCode]?.[topicId] || null
}

export function courseHasLessons(courseCode) {
  return !!byCourse[courseCode] && Object.keys(byCourse[courseCode]).length > 0
}
