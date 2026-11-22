import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
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
import AppHeader from './components/AppHeader.jsx'

// Everything except the landing, sign-up and log-in pages needs a signed-in student.
function RequireAuth({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

// "/" is the public landing page for visitors and the personal dashboard for students.
function Root() {
  const { user, profile } = useAuth()
  if (!user) return <Home />
  if (!profile?.faculty) return <Navigate to="/pick-faculty" replace />
  if (!profile.courses?.length) return <Navigate to="/add-courses" replace />
  return <Dashboard />
}

export default function App() {
  const { loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="font-display text-xl font-semibold">
          First<span className="text-flame">Class</span>
        </div>
      </div>
    )
  }
  return (
    <>
    <AppHeader />
    <Routes>
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
    </Routes>
    </>
  )
}
