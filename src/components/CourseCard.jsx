import React from 'react'
import { Link } from 'react-router-dom'
import SegMeter from './SegMeter.jsx'

export default function CourseCard({ course }) {
  const { code, title, faculty, chaptersCompleted, chaptersTotal } = course
  const started = chaptersCompleted > 0
  const percent = chaptersTotal ? Math.round((chaptersCompleted / chaptersTotal) * 100) : 0

  return (
    <Link
      to={`/course/${code}`}
      className="block bg-white border border-line rounded-lg p-5 hover:border-cobalt transition-colors"
    >
      <div className="flex justify-between items-start mb-3.5">
        <span className="font-mono text-xs text-cobalt-deep font-medium">{code}</span>
        <span className="text-[10.5px] font-medium px-2 py-0.5 rounded bg-cobalt-pale text-cobalt-deep uppercase tracking-wide">
          {faculty}
        </span>
      </div>
      <div className="font-display text-[15.5px] font-semibold mb-4 leading-snug">{title}</div>
      <SegMeter completed={chaptersCompleted} total={chaptersTotal} />
      <div className="text-[11.5px] text-graphite/60 mt-1.5">
        {started ? `${chaptersCompleted} of ${chaptersTotal} chapters · ${percent}%` : 'Not started'}
      </div>
    </Link>
  )
}
