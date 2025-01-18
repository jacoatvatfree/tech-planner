import React from 'react';
import ProjectListItem from './ProjectListItem';
import { useProjectStore } from '../../store/projectStore';

export default function ProjectList() {
  const { projects } = useProjectStore();

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {projects.map((project) => (
          <ProjectListItem key={project.id} project={project} />
        ))}
      </ul>
    </div>
  );
}
