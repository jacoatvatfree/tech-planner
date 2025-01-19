import React, { useState, useEffect } from "react";
    import ProjectList from "../components/projects/ProjectList";
    import ProjectForm from "../components/projects/ProjectForm";
    import { useProjectStore } from "../store/projectStore";
    import { usePlanStore } from "../store/planStore";

    export default function Projects() {
      const { addProject, updateProject, initializeProjects } = useProjectStore();
      const [isModalOpen, setIsModalOpen] = useState(false);
      const [editingProject, setEditingProject] = useState(null);
      const { currentPlanId } = usePlanStore();

      useEffect(() => {
        if (currentPlanId) {
          initializeProjects(currentPlanId);
        }
      }, [currentPlanId, initializeProjects]);

      const handleAddProject = (project) => {
        addProject(project);
        setIsModalOpen(false);
      };

      const handleEditProject = (project) => {
        setEditingProject(project);
        setIsModalOpen(true);
      };

      const handleUpdateProject = (project) => {
        updateProject(project.id, project);
        setIsModalOpen(false);
        setEditingProject(null);
      };

      return (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Projects</h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add Project
            </button>
          </div>
          <ProjectList onEdit={handleEditProject} />
          {isModalOpen && (
            <ProjectForm
              onSubmit={editingProject ? handleUpdateProject : handleAddProject}
              onCancel={() => {
                setIsModalOpen(false);
                setEditingProject(null);
              }}
              editingProject={editingProject}
            />
          )}
        </div>
      );
    }
