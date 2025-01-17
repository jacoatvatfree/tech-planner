import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Engineers from './pages/Engineers'
import Projects from './pages/Projects'
import GanttView from './pages/GanttView'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="engineers" element={<Engineers />} />
        <Route path="projects" element={<Projects />} />
        <Route path="gantt" element={<GanttView />} />
      </Route>
    </Routes>
  )
}

export default App
