# FirstClass — Firestore data model

## `faculties/{facultyId}`
```
{ name: "Sciences" }
```

## `courses/{courseCode}`  e.g. courses/MTH101
```
{
  code: "MTH101",
  title: "Elementary Mathematics I",
  facultyId: "sciences",
  creditUnits: 3,              // set by admin — CGPA calc skips courses missing this
  chapters: [
    {
      id: "ch1",
      title: "Limits and Continuity",
      topics: [
        {
          id: "topic3",
          title: "The limit of a function",
          notes: "<rich text / markdown note content>",
          questions: [
            {
              id: "q1",
              prompt: "Evaluate lim(x→2) (x²−4)/(x−2)",
              options: ["0", "4", "Undefined", "2"],
              correctIndex: 1,
              explanation: "Factor the numerator..."
            }
          ]
        }
      ]
    }
  ]
}
```

## `users/{uid}`
```
{
  phoneNumber: "080...",       // login credential (mapped to synthetic email)
  username: "jozzy_100l",
  email: "jozzy@example.com",  // profile only, not a login credential
  faculty: "sciences",
  courses: ["MTH101", "CHM101"],  // courses the student has added
  streak: 4,
  lastActiveDate: "2026-08-07",
  createdAt: "..."
}
```

## `users/{uid}/testAttempts/{attemptId}`
One per completed test on a single course.
```
{
  courseCode: "MTH101",
  score: 84,                   // out of 100
  takenAt: "...",
  topicResults: [
    { topicId: "topic3", topicName: "The limit of a function", correct: 4, total: 5 }
  ]
}
```
Used to: show the per-course grade, feed `findWeakTopics()`, and feed `calculateGPA()`
by taking each course's latest (or best) attempt as its "score" input.

## `users/{uid}/examAttempts/{attemptId}`
One per cross-course "exam" — the full result-slip experience.
```
{
  takenAt: "...",
  courseResults: [
    { courseCode: "MTH101", score: 84, creditUnits: 3 },
    { courseCode: "CHM101", score: 77, creditUnits: 3 }
  ],
  gpa: 4.17
}
```

## Notes on why it's structured this way
- Courses are top-level documents (not nested under faculty) so a course can
  theoretically be shared across faculties later without duplicating content.
- `creditUnits` lives on the course, not hardcoded in the CGPA util, so you
  can correct it per course as you send in real course data.
- Weak topics aren't a separate collection — they're derived on the fly from
  `topicResults` in test attempts via `findWeakTopics()`, so there's nothing
  to keep in sync.

## Where results are stored today (important)
Tests, practice runs and the in-progress test draft are saved **on the student's own device**
(`src/lib/store.js`, browser localStorage), so scores, CGPA and weak topics work with no account
and offline. Nothing about results is in Firestore yet. Consequence: results do not follow a
student to another phone or browser. To add cloud sync later, mirror `recordTest` and
`recordTopicPractice` into `users/{uid}/testAttempts` and `users/{uid}/topicResults`; no screen
needs to change because every screen reads through `store.js`.
