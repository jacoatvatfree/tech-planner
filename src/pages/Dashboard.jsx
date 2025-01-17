import React from 'react'
import useEngineerStore from '../store/engineerStore'
import useProjectStore from '../store/projectStore'

function Dashboard() {
  const { engineers } = useEngineerStore()
  const { projects } = useProjectStore()

  const totalEngineers = engineers.length
  const totalProjects = projects.length
  const activeProjects = projects.filter(p => 
    new Date(p.endDate) >= new Date()).length

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Total Engineers
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {totalEngineers}
            </dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Total Projects
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {totalProjects}
            </dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Active Projects
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {activeProjects}
            </dd>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          {projects.length === 0 && engineers.length === 0 ? (
            <p className="mt-4 text-gray-500">
              No projects or engineers added yet. Start by adding some resources!
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
