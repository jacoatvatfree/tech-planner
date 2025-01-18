
<<<<<<< HEAD
=======
import React from 'react';
import { useProjectStore } from '../store/projectStore';
import { useEngineerStore } from '../store/engineerStore';

function ProjectList() {
  const { projects, allocateEngineer } = useProjectStore();
  const { engineers } = useEngineerStore();

  const handleAllocateEngineer = (projectId, engineerId) => {
    allocateEngineer(projectId, engineerId);
  };

  return (
    <div className="space-y-4">
      {projects.map(project => (
        <div key={project.id} className="border p-4 rounded">
          <h3 className="font-bold">{project.name}</h3>
          <p>Estimated Hours: {project.estimatedHours}</p>
          <p>Priority: {project.priority}</p>
          
          {/* Engineer allocation */}
          <div className="mt-2">
            <select 
              onChange={(e) => handleAllocateEngineer(project.id, e.target.value)}
              className="border rounded p-1"
            >
              <option value="">Assign Engineer...</option>
              {engineers.map(engineer => (
                <option key={engineer.id} value={engineer.id}>
                  {engineer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Show current allocations */}
          {project.allocations?.length > 0 && (
            <div className="mt-2">
              <p className="font-semibold">Assigned Engineers:</p>
              <ul className="list-disc list-inside">
                {project.allocations.map((allocation, index) => (
                  <li key={index}>
                    {engineers.find(e => e.id === allocation.engineerId)?.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default ProjectList;
>>>>>>> Snippet
