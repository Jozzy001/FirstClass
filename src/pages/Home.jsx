import React from 'react'
import CourseCard from '../components/CourseCard.jsx'
import { Link } from 'react-router-dom'
import { getAllCourses } from '../data/courseData.js'
import { calculateGPA, classify } from '../lib/grading.js'
import { getCourseScores } from '../lib/store.js'

// MTH101/ENG102/etc are placeholders showing where future courses will
// slot in once their content is built.
const placeholderCourses = [
  { code: 'ENG102', title: 'Engineering Drawing', faculty: 'Engineering', chaptersCompleted: 0, chaptersTotal: 9 },
  { code: 'ECO101', title: 'Principles of Economics I', faculty: 'Social sciences', chaptersCompleted: 0, chaptersTotal: 8 }
]

// Free-for-commercial-use photo (Unsplash license — no attribution required).
// Swap this for your own campus photography once you have some; a real
// photo of your actual users will always outperform stock long-term.
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1620829813573-7c9e1877706f?auto=format&fit=crop&w=1200&q=80'

export default function Home() {
  const realCourses = getAllCourses().map((c) => ({
    code: c.code,
    title: c.title,
    faculty: c.faculty,
    chaptersCompleted: 0,
    chaptersTotal: c.topics.length
  }))

  const sampleCourses = [...realCourses, ...placeholderCourses]

  // real scoreboard: the student's own latest test scores
  const scores = getCourseScores()
  const scored = getAllCourses()
    .filter((c) => scores[c.code])
    .map((c) => ({ courseCode: c.code, creditUnits: c.creditUnits, score: scores[c.code].latest.score }))
  const gpa = calculateGPA(scored)
  const cls = classify(gpa.gpa)

  return (
    <div>
      <section
        className="py-16 px-7"
        style={{
          backgroundImage:
            'linear-gradient(#E6E3D9 1px, transparent 1px), linear-gradient(90deg, #E6E3D9 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          borderBottom: '1px solid #E6E3D9'
        }}
      >
        <div className="max-w-[1120px] mx-auto grid md:grid-cols-[1.1fr_0.9fr] gap-14 items-center">
          <div>
            <div className="font-mono text-xs tracking-wider text-cobalt uppercase mb-4 font-medium">
              Every faculty · every course
            </div>
            <h1 className="font-display text-3xl md:text-[40px] font-semibold leading-tight mb-5 -tracking-wide">
              Train for your <span className="text-flame">first class</span>, course by course.
            </h1>
            <p className="text-[16.5px] text-graphite/60 max-w-[440px] mb-8">
              Track mastery topic by topic, drill past questions, and watch your score climb —
              for every course across every faculty.
            </p>
            <div className="flex gap-3.5 flex-wrap">
              <a href="/signup" className="bg-cobalt text-white px-6 py-3 rounded font-medium text-sm">
                Start free
              </a>
              <a href="#courses" className="border border-line bg-white px-6 py-3 rounded font-medium text-sm">
                Browse courses
              </a>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-graphite text-white p-7">
            <div className="absolute inset-0 z-0">
              <img
                src={HERO_IMAGE}
                alt="Student studying on a laptop"
                className="w-full h-full object-cover"
                style={{ filter: 'grayscale(1) contrast(1.1)', opacity: 0.35 }}
              />
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(180deg, rgba(20,23,28,0.55) 0%, #14171C 78%)' }}
              />
            </div>

            <div className="relative z-10">
              <div className="flex justify-between items-center mb-5">
                <span className="font-mono text-[11px] text-white/60 uppercase tracking-wide">Your scoreboard</span>
                <span className="font-mono text-[11px] text-white/60">
                  {scored.length} course{scored.length === 1 ? '' : 's'} tested
                </span>
              </div>
              {scored.length === 0 ? (
                <>
                  <div className="font-display text-3xl font-bold leading-tight mb-2">
                    Take a test to start your CGPA
                  </div>
                  <div className="text-xs text-white/60 mb-5">
                    Each course test is out of 100. Your grade and class appear here.
                  </div>
                  <Link to="/course/PHY101/test" className="inline-block bg-flame text-white px-4 py-2 rounded text-sm font-medium">
                    Try a test
                  </Link>
                </>
              ) : (
                <>
                  <div className="font-display text-5xl font-bold leading-none mb-1">
                    {gpa.gpa === null ? '—' : gpa.gpa.toFixed(2)}<span className="text-flame text-2xl"> / 5</span>
                  </div>
                  <div className="text-xs text-white/60 mb-5">{cls?.name}</div>
                  {scored.map((row) => (
                    <div key={row.courseCode} className="flex justify-between items-center py-2 border-t border-white/10 text-[13px]">
                      <span className="font-mono text-[11.5px] text-white/60 w-16">{row.courseCode}</span>
                      <span className="font-mono">{row.score}/100</span>
                    </div>
                  ))}
                  <Link to="/results" className="inline-block text-sm text-white/80 underline underline-offset-4 mt-4">
                    Full result slip
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="courses" className="py-16 px-7 max-w-[1120px] mx-auto">
        <div className="max-w-[600px] mb-10">
          <div className="font-mono text-xs tracking-wider text-flame uppercase mb-3 font-medium">
            Course library
          </div>
          <h2 className="font-display text-2xl font-semibold mb-2.5 -tracking-wide">
            Every faculty, one library
          </h2>
          <p className="text-graphite/60 text-[15.5px]">
            Pick your course. Each one breaks down into chapters, and each chapter into short,
            readable topics.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {sampleCourses.map((course) => (
            <CourseCard key={course.code} course={course} />
          ))}
        </div>
      </section>

      <section className="bg-graphite text-white text-center py-20 px-7">
        <h2 className="font-display text-3xl font-semibold mb-3.5">
          Start with the free chapters
        </h2>
        <p className="text-white/60 text-[15.5px] mb-7">
          Every course opens its first chapter for free. Unlock the rest as you go.
        </p>
        <a href="/signup" className="bg-cobalt text-white px-6 py-3 rounded font-medium text-sm inline-block">
          Create your account
        </a>
        <div className="text-[12.5px] text-white/50 mt-4">No card required to start</div>
      </section>

      <footer className="bg-graphite border-t border-white/10 py-6 text-center text-xs text-white/50">
        © FirstClass · Built for students across every faculty
      </footer>
    </div>
  )
}
