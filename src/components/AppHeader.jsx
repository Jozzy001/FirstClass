import React from 'react'
import { Link, NavLink } from 'react-router-dom'

export default function AppHeader() {
  const link = ({ isActive }) =>
    `text-sm font-medium px-3 py-2 rounded ${isActive ? 'bg-paper-2 text-graphite' : 'text-graphite/60 hover:text-graphite'}`

  return (
    <header className="no-print sticky top-0 z-30 bg-paper/95 backdrop-blur border-b border-line">
      <div className="max-w-[1120px] mx-auto px-5 sm:px-7 h-14 flex items-center justify-between">
        <Link to="/" className="font-display text-[17px] font-semibold -tracking-wide">
          First<span className="text-flame">Class</span>
        </Link>
        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={link}>Courses</NavLink>
          <NavLink to="/results" className={link}>Results</NavLink>
        </nav>
      </div>
    </header>
  )
}
