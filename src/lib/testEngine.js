// Builds and scores a course test (always reported out of 100).

export const TEST_SIZE = 30
export const TEST_MINUTES = 45

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Pick questions across all topics of a course.
 * Bigger topics get more questions, but only in proportion to the square root
 * of their size, so a 67-question topic does not crowd out a 4-question one
 * (D'Hondt allocation). Option order is never shuffled: many questions use
 * "None of the above" / "(a) and (b)" style options that depend on order.
 */
export function buildTest(course, size = TEST_SIZE) {
  const pools = course.topics
    .filter((t) => t.questions.length > 0)
    .map((t) => ({
      weight: Math.sqrt(t.questions.length),
      take: 0,
      items: shuffle(t.questions).map((q) => ({ ...q, topicId: t.id, topicTitle: t.title }))
    }))

  const available = pools.reduce((s, p) => s + p.items.length, 0)
  const target = Math.min(size, available)

  for (let picked = 0; picked < target; picked++) {
    let best = null
    let bestScore = -1
    for (const p of pools) {
      if (p.take >= p.items.length) continue
      const score = p.weight / (p.take + 1)
      if (score > bestScore) {
        bestScore = score
        best = p
      }
    }
    best.take += 1
  }

  return shuffle(pools.flatMap((p) => p.items.slice(0, p.take)))
}

/** answers[i] is the chosen option index for questions[i], or null if skipped. */
export function scoreTest(questions, answers) {
  const total = questions.length
  let correct = 0
  const topics = {}
  const wrong = []

  questions.forEach((q, i) => {
    const t = (topics[q.topicId] ||= { topicId: q.topicId, topicTitle: q.topicTitle, correct: 0, total: 0 })
    t.total += 1
    if (answers[i] === q.correctIndex) {
      correct += 1
      t.correct += 1
    } else {
      wrong.push({ question: q, chosen: answers[i] })
    }
  })

  return {
    correct,
    total,
    score: total ? Math.round((correct / total) * 100) : 0,
    topicResults: Object.values(topics),
    wrong
  }
}
