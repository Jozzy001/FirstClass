import React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function AppHeader() {
  const { user, logOut } = useAuth()
  const navigate = useNavigate()
  const link = ({ isActive }) =>
    `text-sm font-medium px-3 py-2 rounded ${isActive ? 'bg-paper-2 text-graphite' : 'text-graphite/60 hover:text-graphite'}`

  async function handleLogOut() {
    await logOut()
    navigate('/')
  }

  return (
    <header className="no-print sticky top-0 z-30 bg-paper/95 backdrop-blur border-b border-line">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-7 h-14 flex items-center justify-between">
        <Link to="/" className="font-display text-[17px] font-semibold -tracking-wide">
          First<span className="text-flame">Class</span>
        </Link>
        <nav className="flex items-center gap-0.5 sm:gap-1">
          {user ? (
            <>
              <NavLink to="/" end className={link}>Dashboard</NavLink>
              <NavLink to="/results" className={link}>Results</NavLink>
              <button onClick={handleLogOut} className="text-sm font-medium px-3 py-2 text-graphite/60 hover:text-graphite">
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={link}>Log in</NavLink>
              <Link to="/signup" className="ml-1 bg-cobalt text-white text-sm font-medium px-3.5 py-2 rounded">
                Start free
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
