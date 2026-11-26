import React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function AppHeader() {
  const { user, isAdmin, logOut } = useAuth()
  const navigate = useNavigate()
  const link = ({ isActive }) =>
    `press whitespace-nowrap text-[13px] sm:text-sm font-medium px-1 min-[360px]:px-2 sm:px-3 py-2.5 rounded ${isActive ? 'bg-paper-2 text-graphite' : 'text-graphite/60 hover:text-graphite'}`

  async function handleLogOut() {
    await logOut()
    navigate('/')
  }

  return (
    <header className="no-print sticky top-0 z-30 bg-paper/95 backdrop-blur border-b border-line" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="max-w-[1120px] mx-auto px-3 min-[360px]:px-4 sm:px-7 h-14 flex items-center justify-between">
        <Link to="/" className="font-display text-[17px] font-semibold -tracking-wide py-2.5 pr-3">
          First<span className="text-flame">Class</span>
        </Link>
        <nav className="flex items-center gap-0.5 sm:gap-1">
          {user ? (
            <>
              <NavLink to="/" end className={link}>
                <span className="min-[360px]:hidden">Home</span>
                <span className="hidden min-[360px]:inline">Dashboard</span>
              </NavLink>
              <NavLink to="/results" className={link}>Results</NavLink>
              {isAdmin && <NavLink to="/admin" className={link} data-testid="admin-link">Admin</NavLink>}
              <button onClick={handleLogOut} className="press whitespace-nowrap text-[13px] sm:text-sm font-medium px-1 min-[360px]:px-2 sm:px-3 py-2.5 text-graphite/60 hover:text-graphite">
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={link}>Log in</NavLink>
              <Link to="/signup" className="press ml-1 bg-cobalt text-white text-[13px] sm:text-sm font-medium px-3 sm:px-3.5 py-2.5 rounded">
                Start free
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
