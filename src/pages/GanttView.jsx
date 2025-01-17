import React from 'react'
import GanttChart from '../components/GanttChart'
import useProjectStore from '../store/projectStore'

function GanttView() {
  const { projects, updateProject } = useProjectStore()

  const tasks = projects.map(project => ({
    id: project.id,
    text: project.name,
    start_date: project.startDate,
    end_date: project.endDate,
    allocation: project.allocation,
    progress: project.progress || 0
  }))

  const handleTaskUpdate = (id, updates) => {
    updateProject(id, updates)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Resource Schedule</h2>
      <GanttChart tasks={tasks} onTaskUpdate={handleTaskUpdate} />
    </div>
  )
}

export default GanttView
