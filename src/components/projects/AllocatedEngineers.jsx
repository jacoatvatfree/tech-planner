import React from 'react';

export default function AllocatedEngineers({ project, engineers }) {
  const getEngineerName = (engineerId) => {
    const engineer = engineers.find(e => e.id === engineerId);
    return engineer ? engineer.name : 'Unknown Team Member';
  };

  if (!project.allocations?.length) {
    return null;
  }

  return (
    <div className="mt-2">
      <p className="font-semibold">Allocated Team Members:</p>
      <ul className="list-disc list-inside">
        {project.allocations.map((allocation, index) => (
          <li key={index}>
            {getEngineerName(allocation.engineerId)}
          </li>
        ))}
      </ul>
    </div>
  );
}
