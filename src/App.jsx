import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import SignUp from './pages/SignUp.jsx'
import PickFaculty from './pages/PickFaculty.jsx'
import AddCourses from './pages/AddCourses.jsx'
import CourseTopics from './pages/CourseTopics.jsx'
import Reader from './pages/Reader.jsx'
import Practice from './pages/Practice.jsx'
import Test from './pages/Test.jsx'
import Results from './pages/Results.jsx'
import AppHeader from './components/AppHeader.jsx'

export default function App() {
  return (
    <>
    <AppHeader />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/pick-faculty" element={<PickFaculty />} />
      <Route path="/add-courses" element={<AddCourses />} />
      <Route path="/course/:code" element={<CourseTopics />} />
      <Route path="/course/:code/read/:topicId" element={<Reader />} />
      <Route path="/course/:code/practice/:topicId" element={<Practice />} />
      <Route path="/course/:code/test" element={<Test />} />
      <Route path="/results" element={<Results />} />
    </Routes>
    </>
  )
}
