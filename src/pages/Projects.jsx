import React, { useState, useEffect } from "react";
import ProjectList from "../components/projects/ProjectList";
import ProjectForm from "../components/projects/ProjectForm";
import { useProjectStore } from "../store/projectStore";
import { usePlanStore } from "../store/planStore";

export default function Projects() {
  const {
    addProject,
    updateProject,
    initializeProjects,
    reprioritizeProjects,
  } = useProjectStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const { currentPlanId, plans } = usePlanStore();
  const currentPlan = plans.find((plan) => plan.id === currentPlanId);

  useEffect(() => {
    if (currentPlanId) {
      initializeProjects(currentPlanId);
    }
  }, [currentPlanId, initializeProjects]);

  const handleAddProject = async (project) => {
    try {
      const newProject = {
        ...project,
        planId: currentPlanId,
      };
      await addProject(newProject);
      await initializeProjects(currentPlanId);
      reprioritizeProjects();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to add project:", error);
    }
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleUpdateProject = async (project) => {
    try {
      const updatedProject = {
        ...editingProject,
        ...project,
        id: editingProject.id,
        planId: currentPlanId || editingProject.planId,
        allocations: project.allocations.map((allocation) => ({
          ...allocation,
          startDate: new Date(allocation.startDate),
          endDate: new Date(allocation.endDate),
        })),
      };

      await updateProject(updatedProject);
      await initializeProjects(updatedProject.planId);
      reprioritizeProjects();
      setIsModalOpen(false);
      setEditingProject(null);
    } catch (error) {
      console.error("Failed to update project:", error);
    }
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
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <ProjectForm
                onSubmit={
                  editingProject ? handleUpdateProject : handleAddProject
                }
                onCancel={() => {
                  setIsModalOpen(false);
                  setEditingProject(null);
                }}
                editingProject={editingProject}
                planStartDate={currentPlan?.startDate}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
