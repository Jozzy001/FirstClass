// Standard Nigerian university grading scale (5.0 system).
// Test/exam scores are out of 100; this maps a score to a letter grade
// and its grade point, then weights by credit unit for GPA/CGPA.
const GRADE_BANDS = [
  { min: 70, letter: 'A', point: 5 },
  { min: 60, letter: 'B', point: 4 },
  { min: 50, letter: 'C', point: 3 },
  { min: 45, letter: 'D', point: 2 },
  { min: 40, letter: 'E', point: 1 },
  { min: 0, letter: 'F', point: 0 }
]

export function scoreToGrade(scoreOutOf100) {
  const band = GRADE_BANDS.find((b) => scoreOutOf100 >= b.min)
  return { letter: band.letter, point: band.point }
}

/**
 * results: [{ courseCode, creditUnits, score }]
 * Returns the credit-unit-weighted GPA (0–5 scale) plus a per-course breakdown.
 * A course with no creditUnits set yet is excluded from the calculation
 * rather than silently assumed — surface it to the user as "pending" instead.
 */
export function calculateGPA(results) {
  const usable = results.filter((r) => typeof r.creditUnits === 'number' && r.creditUnits > 0)
  const skipped = results.filter((r) => !usable.includes(r))

  const breakdown = usable.map((r) => {
    const { letter, point } = scoreToGrade(r.score)
    return { ...r, letter, point, qualityPoints: point * r.creditUnits }
  })

  const totalUnits = breakdown.reduce((sum, r) => sum + r.creditUnits, 0)
  const totalQualityPoints = breakdown.reduce((sum, r) => sum + r.qualityPoints, 0)
  const gpa = totalUnits > 0 ? +(totalQualityPoints / totalUnits).toFixed(2) : null

  return {
    gpa,
    scale: 5.0,
    breakdown,
    skipped: skipped.map((r) => r.courseCode) // courses missing credit-unit data
  }
}

/**
 * Given quiz attempt records, returns topics the student is weak in —
 * anything under 60% correct across attempts, most recent first.
 * attempts: [{ topicId, topicName, correct, total }]
 */
export function findWeakTopics(attempts, threshold = 0.6) {
  return attempts
    .map((a) => ({ ...a, accuracy: a.total > 0 ? a.correct / a.total : 0 }))
    .filter((a) => a.accuracy < threshold)
    .sort((a, b) => a.accuracy - b.accuracy)
}

/**
 * Degree classification on the standard Nigerian 5.0 scale.
 * Returns the class plus how far the student is from the next one up.
 */
const CLASSES = [
  { min: 4.5, name: 'First Class' },
  { min: 3.5, name: 'Second Class Upper' },
  { min: 2.4, name: 'Second Class Lower' },
  { min: 1.5, name: 'Third Class' },
  { min: 1.0, name: 'Pass' },
  { min: 0, name: 'Below Pass' }
]

export function classify(gpa) {
  if (gpa === null || gpa === undefined) return null
  const idx = CLASSES.findIndex((c) => gpa >= c.min)
  const current = CLASSES[idx]
  const next = idx > 0 ? CLASSES[idx - 1] : null
  return {
    name: current.name,
    nextName: next ? next.name : null,
    pointsToNext: next ? +(next.min - gpa).toFixed(2) : 0
  }
}

/** Overall percentage = total correct / total answered, across a set of topic stats. */
export function overallAccuracy(stats) {
  const total = stats.reduce((s, t) => s + t.total, 0)
  const correct = stats.reduce((s, t) => s + t.correct, 0)
  return total ? Math.round((correct / total) * 100) : null
}
