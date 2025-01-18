import React, { useState } from "react";
import { useProjectStore } from "../store/projectStore";
import { PlusIcon } from "@heroicons/react/24/outline";
import ProjectList from "../components/projects/ProjectList";
import ProjectForm from "../components/projects/ProjectForm";

function Projects() {
  const { addProject, updateProject } = useProjectStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const handleSubmit = (projectData) => {
    if (editingProject) {
      updateProject(editingProject.id, projectData);
    } else {
      addProject(projectData);
    }
    setIsModalOpen(false);
    setEditingProject(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Project
        </button>
      </div>

      <ProjectList
        onEdit={(project) => {
          setEditingProject(project);
          setIsModalOpen(true);
        }}
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <ProjectForm
            onSubmit={handleSubmit}
            editingProject={editingProject}
            onCancel={() => {
              setIsModalOpen(false);
              setEditingProject(null);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default Projects;
