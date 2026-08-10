import React from 'react'
import CourseCard from '../components/CourseCard.jsx'
import { getAllCourses } from '../data/courseData.js'

// MTH101/ENG102/etc are placeholders showing where future courses will
// slot in once their content is built.
const placeholderCourses = [
  { code: 'MTH101', title: 'Elementary Mathematics I', faculty: 'Sciences', chaptersCompleted: 0, chaptersTotal: 12 },
  { code: 'ENG102', title: 'Engineering Drawing', faculty: 'Engineering', chaptersCompleted: 0, chaptersTotal: 9 },
  { code: 'ECO101', title: 'Principles of Economics I', faculty: 'Social sciences', chaptersCompleted: 0, chaptersTotal: 8 },
  { code: 'CHM101', title: 'General Chemistry I', faculty: 'Sciences', chaptersCompleted: 0, chaptersTotal: 12 },
  { code: 'GST101', title: 'Use of English', faculty: 'General studies', chaptersCompleted: 0, chaptersTotal: 10 }
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
              100 level · every faculty
            </div>
            <h1 className="font-display text-3xl md:text-[40px] font-semibold leading-tight mb-5 -tracking-wide">
              Train for your <span className="text-flame">first class</span>, course by course.
            </h1>
            <p className="text-[16.5px] text-graphite/60 max-w-[440px] mb-8">
              Track mastery topic by topic, drill past questions, and watch your score climb —
              for every 100 level course across every faculty.
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
                <span className="font-mono text-[11px] text-white/60 uppercase tracking-wide">Overall mastery</span>
                <span className="font-mono text-[11px] text-white/60">4 courses</span>
              </div>
              <div className="font-display text-5xl font-bold leading-none mb-1">
                78<span className="text-flame text-2xl">%</span>
              </div>
              <div className="text-xs text-white/60 mb-5">Up 12% this week</div>
              {[
                { code: 'MTH101', grade: '84%' },
                { code: 'PHY101', grade: '61%' },
                { code: 'CHM101', grade: '77%' },
                { code: 'GST101', grade: '90%' }
              ].map((row) => (
                <div key={row.code} className="flex justify-between items-center py-2 border-t border-white/10 text-[13px]">
                  <span className="font-mono text-[11.5px] text-white/60 w-16">{row.code}</span>
                  <span className="font-mono">{row.grade}</span>
                </div>
              ))}
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
    </div>
  )
}
