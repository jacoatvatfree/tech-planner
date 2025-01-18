import React, { useState, useMemo } from "react";
import ProjectListItem from "./ProjectListItem";
import { useProjectStore } from "../../store/projectStore";

export default function ProjectList({ onEdit }) {
  const { projects, updateProject } = useProjectStore();
  const [draggedProject, setDraggedProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleDragOver = (e) => {
    e.preventDefault();
    const dragOverItem = e.target.closest("li");
    if (dragOverItem) {
      dragOverItem.style.borderTop = "2px solid #3b82f6";
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    const dragLeaveItem = e.target.closest("li");
    if (dragLeaveItem) {
      dragLeaveItem.style.borderTop = "";
    }
  };

  const handleDrop = (e, targetProject) => {
    e.preventDefault();
    const dragLeaveItem = e.target.closest("li");
    if (dragLeaveItem) {
      dragLeaveItem.style.borderTop = "";
    }

    if (!draggedProject || draggedProject.id === targetProject.id) return;

    // Get current sorted projects
    const sortedProjects = [...projects].sort(
      (a, b) => a.priority - b.priority,
    );

    // Remove dragged project from array
    const withoutDragged = sortedProjects.filter(
      (p) => p.id !== draggedProject.id,
    );

    // Find insert index
    const targetIndex = withoutDragged.findIndex(
      (p) => p.id === targetProject.id,
    );

    // Create new array with project in new position
    const reorderedProjects = [
      ...withoutDragged.slice(0, targetIndex),
      draggedProject,
      ...withoutDragged.slice(targetIndex),
    ];

    // Update all projects with new sequential priorities
    reorderedProjects.forEach((project, index) => {
      updateProject(project.id, {
        ...project,
        priority: index + 1,
      });
    });
  };

  const filteredAndSortedProjects = useMemo(() => {
    return [...projects]
      .filter((project) =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .sort((a, b) => a.priority - b.priority);
  }, [projects, searchTerm]);

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredAndSortedProjects.map((project) => (
            <li
              key={project.id}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, project)}
            >
              <ProjectListItem
                project={project}
                onEdit={onEdit}
                onDragStart={() => setDraggedProject(project)}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
