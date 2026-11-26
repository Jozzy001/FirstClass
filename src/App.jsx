import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Login from './pages/Login.jsx'
import { useAuth } from './context/AuthContext.jsx'
import SignUp from './pages/SignUp.jsx'
import PickFaculty from './pages/PickFaculty.jsx'
import AddCourses from './pages/AddCourses.jsx'
import CourseTopics from './pages/CourseTopics.jsx'
import Reader from './pages/Reader.jsx'
import Practice from './pages/Practice.jsx'
import Test from './pages/Test.jsx'
import Results from './pages/Results.jsx'
import Account from './pages/Account.jsx'
import AppHeader from './components/AppHeader.jsx'

// Admin code is only downloaded when an admin opens the page, so students never carry it.
const Admin = lazy(() => import('./pages/Admin.jsx'))

// Everything except the landing, sign-up and log-in pages needs a signed-in student.
function RequireAuth({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

// After an admin sets a temporary password, the student is asked to choose their own.
function PasswordBanner() {
  const { profile } = useAuth()
  const { pathname } = useLocation()
  if (!profile?.mustChangePassword || pathname === '/account') return null
  return (
    <div className="bg-flame-pale border-b border-flame/20 px-4 py-2.5 text-center text-[13.5px]" data-testid="password-banner">
      You are using a temporary password.{' '}
      <Link to="/account" className="font-medium text-flame underline underline-offset-2 inline-block py-1">Choose your own password</Link>
    </div>
  )
}

function Splash() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-paper">
      <div className="font-display text-xl font-semibold logo-pulse">
        First<span className="text-flame">Class</span>
      </div>
    </div>
  )
}

// "/" is the public landing page for visitors and the personal dashboard for students.
function Root() {
  const { user, profile, profileError, refreshProfile } = useAuth()
  if (!user) return <Home />
  if (profileError) {
    return (
      <div className="max-w-[420px] mx-auto px-6 py-24 text-center">
        <h1 className="font-display text-xl font-semibold mb-3">We could not load your account</h1>
        <p className="text-sm text-graphite/65 mb-6">Check your internet connection and try again. Your courses and progress are safe.</p>
        <button onClick={refreshProfile} className="press bg-cobalt text-white px-6 py-3 rounded font-medium text-sm">Try again</button>
      </div>
    )
  }
  if (profile === undefined) return <Splash />
  if (!profile?.faculty) return <Navigate to="/pick-faculty" replace />
  if (!profile.courses?.length) return <Navigate to="/add-courses" replace />
  return <Dashboard />
}

export default function App() {
  const { loading } = useAuth()
  const location = useLocation()
  if (loading) return <Splash />
  return (
    <>
    <AppHeader />
    <PasswordBanner />
    <div key={location.pathname} className="page-in">
    <Routes location={location}>
      <Route path="/" element={<Root />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/pick-faculty" element={<RequireAuth><PickFaculty /></RequireAuth>} />
      <Route path="/add-courses" element={<RequireAuth><AddCourses /></RequireAuth>} />
      <Route path="/course/:code" element={<RequireAuth><CourseTopics /></RequireAuth>} />
      <Route path="/course/:code/read/:topicId" element={<RequireAuth><Reader /></RequireAuth>} />
      <Route path="/course/:code/practice/:topicId" element={<RequireAuth><Practice /></RequireAuth>} />
      <Route path="/course/:code/test" element={<RequireAuth><Test /></RequireAuth>} />
      <Route path="/results" element={<RequireAuth><Results /></RequireAuth>} />
      <Route path="/account" element={<RequireAuth><Account /></RequireAuth>} />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <Suspense fallback={<Splash />}>
              <Admin />
            </Suspense>
          </RequireAuth>
        }
      />
    </Routes>
    </div>
    </>
  )
}
