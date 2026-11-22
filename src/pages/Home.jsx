import React from 'react'
import { Link } from 'react-router-dom'
import { getAllCourses } from '../data/courseData.js'
import { useCountUp } from '../lib/useMotion.js'

// Public landing page: it explains the app and sends visitors to sign up or log in.
// Courses, tests and results are only opened once a student is signed in.

const STEPS = [
  { n: '01', title: 'Create your account', body: 'Sign up with your phone number, pick your faculty and add the courses you are offering this session.' },
  { n: '02', title: 'Read, then practise', body: 'Short topic notes end with the key formula or fact. Then answer past-question style practice, with the reason behind every answer.' },
  { n: '03', title: 'Test yourself, see your CGPA', body: 'Take a timed test for each course. Get a score out of 100, a grade, and a result slip with your CGPA on the 5.0 scale.' }
]

const FEATURES = [
  { icon: '📖', title: 'Notes that get to the point', body: 'Every course is broken into short topics you can finish in one sitting, each ending with a key formula or key fact.' },
  { icon: '🎯', title: 'Practice by topic', body: 'Answer questions one topic at a time and see the explanation straight away, so you learn from every mistake.' },
  { icon: '⏱️', title: 'Timed course tests', body: '30 questions in 45 minutes, scored out of 100. If your phone locks or the page reloads, you pick up where you stopped.' },
  { icon: '🎓', title: 'Result slip and CGPA', body: 'Letter grade, grade points and a credit-unit weighted CGPA on the 5.0 scale, just like your school result.' },
  { icon: '🔍', title: 'Weak topics found for you', body: 'The topics you keep getting wrong are surfaced on your dashboard, so you spend time where it counts.' },
  { icon: '🔥', title: 'Habits that stick', body: 'A daily question goal, a study streak and a focus timer help you build a steady revision routine.' }
]

const FAQ = [
  { q: 'Is it free?', a: 'You can start free. The first topic of every course is open to you as soon as you sign in.' },
  { q: 'Do I need an email address?', a: 'No. You sign up and log in with your phone number and a password. Email is optional.' },
  { q: 'Will it work on my phone?', a: 'Yes. FirstClass is built for phones first and works on laptops too. You can add it to your home screen like an app.' },
  { q: 'Where do the questions come from?', a: 'They are built from past exam questions. Where a question was unclear or incomplete, we hold it back rather than guess.' }
]

export default function Home() {
  const courses = getAllCourses()
  const topicCount = courses.reduce((s, c) => s + c.topics.length, 0)
  const questionCount = courses.reduce((s, c) => s + c.topics.reduce((a, t) => a + t.questions.length, 0), 0)

  return (
    <div>
      {/* Hero */}
      <section
        className="px-5 sm:px-7 pt-14 pb-16 sm:pt-20 sm:pb-24"
        style={{
          backgroundImage:
            'linear-gradient(#E6E3D9 1px, transparent 1px), linear-gradient(90deg, #E6E3D9 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          borderBottom: '1px solid #E6E3D9'
        }}
      >
        <div className="max-w-[1120px] mx-auto grid md:grid-cols-[1.1fr_0.9fr] gap-12 md:gap-14 items-center">
          <div>
            <div className="font-mono text-xs tracking-wider text-cobalt uppercase mb-4 font-medium">
              The study app for university students
            </div>
            <h1 className="font-display text-[32px] md:text-[44px] font-semibold leading-[1.12] mb-5 -tracking-wide">
              Study smarter. Score higher. Aim for your <span className="text-flame">first class</span>.
            </h1>
            <p className="text-[16.5px] text-graphite/65 max-w-[480px] mb-8 leading-relaxed">
              Short notes, past-question practice, timed tests and a CGPA tracker, all in one place
              and built to work on your phone.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link to="/signup" className="press bg-cobalt text-white px-6 py-3.5 rounded font-medium text-sm">
                Start free
              </Link>
              <Link to="/login" className="press border border-line bg-white px-6 py-3.5 rounded font-medium text-sm">
                I already have an account
              </Link>
            </div>
            <div className="text-[12.5px] text-graphite/50 mt-4">No card needed · Sign up with your phone number</div>
          </div>

          <DashboardPreview />
        </div>
      </section>

      {/* Real numbers */}
      <section className="bg-graphite text-white px-5 sm:px-7 py-8" data-testid="stats-strip">
        <div className="max-w-[1120px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <Stat value={courses.length} label="courses ready" />
          <Stat value={topicCount} label="topics with notes" />
          <Stat value={questionCount.toLocaleString('en-US')} label="practice questions" />
          <Stat value="45 min" label="timed course tests" />
        </div>
      </section>

      {/* How it works */}
      <section className="px-5 sm:px-7 py-16 sm:py-20">
        <div className="max-w-[1120px] mx-auto">
          <SectionHead kicker="How it works" title="From sign-up to your CGPA in three steps" />
          <div className="grid md:grid-cols-3 gap-4">
            {STEPS.map((s) => (
              <div key={s.n} className="bg-white border border-line rounded-xl p-6">
                <div className="font-mono text-xs text-flame font-medium mb-3">{s.n}</div>
                <div className="font-display text-[17px] font-semibold mb-2 leading-snug">{s.title}</div>
                <p className="text-sm text-graphite/65 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-paper-2 px-5 sm:px-7 py-16 sm:py-20 border-y border-line">
        <div className="max-w-[1120px] mx-auto">
          <SectionHead kicker="What you get" title="Everything you need to revise properly" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white border border-line rounded-xl p-6">
                <div className="text-2xl mb-3" aria-hidden="true">{f.icon}</div>
                <div className="font-display text-[15.5px] font-semibold mb-1.5">{f.title}</div>
                <p className="text-sm text-graphite/65 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses available */}
      <section className="px-5 sm:px-7 py-16 sm:py-20" data-testid="course-showcase">
        <div className="max-w-[1120px] mx-auto">
        <SectionHead kicker="Course library" title="Courses you can study today" />
        <div className="flex flex-wrap gap-2.5 mb-6">
          {courses.map((c) => (
            <div key={c.code} className="bg-white border border-line rounded-lg px-4 py-2.5">
              <span className="font-mono text-xs text-cobalt-deep font-medium mr-2">{c.code}</span>
              <span className="text-sm">{c.title}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-graphite/60">
          More courses are added regularly. <Link to="/signup" className="text-cobalt font-medium">Create a free account</Link> to open them.
        </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-paper-2 px-5 sm:px-7 py-16 sm:py-20 border-y border-line">
        <div className="max-w-[760px] mx-auto">
          <SectionHead kicker="Questions" title="Quick answers" />
          <div className="space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="bg-white border border-line rounded-lg px-5 py-4 group">
                <summary className="font-medium text-[15px] cursor-pointer list-none flex justify-between items-center gap-4">
                  {f.q}
                  <span className="text-graphite/40 group-open:rotate-45 transition-transform text-lg leading-none">+</span>
                </summary>
                <p className="text-sm text-graphite/65 mt-3 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final call to action */}
      <section className="bg-graphite text-white text-center py-16 sm:py-20 px-5 sm:px-7">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-3.5">Ready to start your first topic?</h2>
        <p className="text-white/60 text-[15.5px] mb-7 max-w-[480px] mx-auto">
          Create your free account, pick your courses, and your dashboard will be ready in a minute.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link to="/signup" className="press bg-flame text-white px-6 py-3.5 rounded font-medium text-sm">Create your account</Link>
          <Link to="/login" className="press border border-white/25 px-6 py-3.5 rounded font-medium text-sm">Log in</Link>
        </div>
      </section>

      <footer className="bg-graphite border-t border-white/10 py-6 text-center text-xs text-white/50">
        © FirstClass · Built for university students
      </footer>
    </div>
  )
}

function SectionHead({ kicker, title }) {
  return (
    <div className="max-w-[600px] mb-9">
      <div className="font-mono text-xs tracking-wider text-flame uppercase mb-3 font-medium">{kicker}</div>
      <h2 className="font-display text-2xl sm:text-[28px] font-semibold -tracking-wide leading-tight">{title}</h2>
    </div>
  )
}

function Stat({ value, label }) {
  return (
    <div>
      <div className="font-display text-3xl font-bold">{value}</div>
      <div className="text-xs text-white/60 mt-1">{label}</div>
    </div>
  )
}

// A static illustration of the student dashboard. The numbers are an example, not real data.
function DashboardPreview() {
  const cgpa = useCountUp(4.52, { decimals: 2, duration: 1400, delay: 500 })
  const streak = useCountUp(6, { duration: 900, delay: 700 })
  return (
    <div className="relative" aria-hidden="true">
      <div className="bg-white border border-line rounded-2xl p-4 sm:p-5 shadow-[0_20px_50px_-20px_rgba(20,23,28,0.25)]">
        <div className="flex items-center justify-between mb-4">
          <div className="font-display text-sm font-semibold">Good morning, Ada</div>
          <div className="font-mono text-[11px] text-graphite/40 uppercase">Example</div>
        </div>
        <div className="grid grid-cols-[1.2fr_1fr] gap-3 mb-3">
          <div className="bg-graphite text-white rounded-xl p-4">
            <div className="font-mono text-[11px] text-white/60 uppercase mb-1">Your CGPA</div>
            <div className="font-display text-3xl font-bold leading-none">{cgpa}<span className="text-xs text-white/40"> / 5</span></div>
            <div className="text-[11px] text-white/60 mt-2">First Class</div>
          </div>
          <div className="bg-paper-2 rounded-xl p-4">
            <div className="font-mono text-[11px] text-graphite/50 uppercase mb-1">Streak</div>
            <div className="font-display text-3xl font-bold leading-none">{streak}<span className="text-xs text-graphite/40"> days</span></div>
            <div className="flex gap-1 mt-2.5">
              {[1, 1, 1, 1, 1, 1, 0].map((on, i) => (
                <i key={i} style={{ '--i': i }} className={`flex-1 h-2 rounded-sm ${on ? 'bg-mint pop' : 'bg-white'}`} />
              ))}
            </div>
          </div>
        </div>
        {[['BIO101', 70, '68/100 · B'], ['CHM101', 40, '74/100 · A'], ['MTH101', 15, 'Not tested']].map(([code, pct, tag], bi) => (
          <div key={code} className="border border-line rounded-lg px-3 py-2.5 mb-2 last:mb-0">
            <div className="flex justify-between text-[11px] mb-1.5">
              <span className="font-mono text-cobalt-deep font-medium">{code}</span>
              <span className="text-graphite/50">{tag}</span>
            </div>
            <div className="h-1.5 bg-paper-2 rounded-sm"><div className="h-full bg-cobalt rounded-sm bar-grow" style={{ width: `${pct}%`, '--i': bi + 2 }} /></div>
          </div>
        ))}
      </div>
    </div>
  )
}
