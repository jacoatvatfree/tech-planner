import React from 'react';
import { format } from 'date-fns';
import { PencilIcon, TrashIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useProjectStore } from '../../store/projectStore';
import { useEngineerStore } from '../../store/engineerStore';
import AllocatedEngineers from './AllocatedEngineers';

export default function ProjectListItem({ project }) {
  const { updateProject, removeProject } = useProjectStore();
  const { engineers } = useEngineerStore();

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', project.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <li
      draggable="true"
      onDragStart={handleDragStart}
      className="px-6 py-4 cursor-move hover:bg-gray-50"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="cursor-move">
            <Bars3Icon className="h-5 w-5 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
            <div className="mt-1 text-sm text-gray-500">
              <p>{project.description}</p>
              <p>Estimated Hours: {project.estimatedHours}</p>
              <p>Priority: {project.priority}</p>
              <p>
                Start After:{' '}
                {project.startAfter
                  ? format(new Date(project.startAfter), 'MMM d, yyyy')
                  : 'Not set'}
              </p>
              <p>
                End Before:{' '}
                {project.endBefore
                  ? format(new Date(project.endBefore), 'MMM d, yyyy')
                  : 'Not set'}
              </p>
              
              <AllocatedEngineers project={project} engineers={engineers} />
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => updateProject(project.id)}
            className="p-2 text-blue-600 hover:text-blue-800"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => removeProject(project.id)}
            className="p-2 text-red-600 hover:text-red-800"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </li>
  );
}
