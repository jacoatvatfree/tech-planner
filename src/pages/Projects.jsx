import React, { useState, useMemo } from "react";
import { useProjectStore } from "../store/projectStore";
import { useEngineerStore } from "../store/engineerStore";
import { makeProject } from "../lib";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";

function Projects() {
  const { projects, addProject, updateProject, removeProject } =
    useProjectStore();
  const { engineers } = useEngineerStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    estimatedHours: 0,
    startAfter: format(new Date(), "yyyy-MM-dd"),
    endBefore: "",
    priority: projects.length + 1,
    allocations: [],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const projectData = {
      ...makeProject({
        name: formData.name,
        estimatedHours: Number(formData.estimatedHours),
        startAfter: formData.startAfter ? new Date(formData.startAfter) : null,
        endBefore: formData.endBefore ? new Date(formData.endBefore) : null,
        priority: Number(formData.priority),
      }),
      description: formData.description,
      allocations: formData.allocations,
    };

    if (editingProject) {
      updateProject(editingProject.id, projectData);
    } else {
      addProject(projectData);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      estimatedHours: 0,
      startAfter: format(new Date(), "yyyy-MM-dd"),
      endBefore: "",
      priority: 3,
      assignedEngineers: [],
    });
    setEditingProject(null);
    setIsModalOpen(false);
  };

  const startEdit = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || "",
      estimatedHours: project.estimatedHours,
      startAfter: project.startAfter
        ? format(new Date(project.startAfter), "yyyy-MM-dd")
        : "",
      endBefore: project.endBefore
        ? format(new Date(project.endBefore), "yyyy-MM-dd")
        : "",
      priority: project.priority,
      allocations: project.allocations || [],
    });
    setIsModalOpen(true);
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

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul
          className="divide-y divide-gray-200"
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
          }}
          onDrop={(e) => {
            e.preventDefault();
            const draggedId = e.dataTransfer.getData("text/plain");
            const dropTarget = e.target.closest("li");
            if (!dropTarget) return;

            const items = [...projects].sort((a, b) => a.priority - b.priority);
            const draggedIndex = items.findIndex(
              (item) => item.id === draggedId,
            );
            const dropIndex = Array.from(
              dropTarget.parentNode.children,
            ).indexOf(dropTarget);

            if (draggedIndex === dropIndex) return;

            const [draggedItem] = items.splice(draggedIndex, 1);
            items.splice(dropIndex, 0, draggedItem);

            // Update priorities
            items.forEach((item, index) => {
              updateProject(item.id, {
                ...item,
                priority: index + 1,
              });
            });
          }}
        >
          {[...projects]
            .sort((a, b) => a.priority - b.priority)
            .map((project, index) => (
              <li
                key={project.id}
                draggable="true"
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", project.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                className="px-6 py-4 cursor-move hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="cursor-move">
                      <Bars3Icon className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {project.name}
                      </h3>
                      <div className="mt-1 text-sm text-gray-500">
                        <p>{project.description}</p>
                        <p>Estimated Hours: {project.estimatedHours}</p>
                        <p>Priority: {project.priority}</p>
                        <p>
                          Start After:{" "}
                          {project.startAfter
                            ? format(
                                new Date(project.startAfter),
                                "MMM d, yyyy",
                              )
                            : "Not set"}
                        </p>
                        <p>
                          End Before:{" "}
                          {project.endBefore
                            ? format(new Date(project.endBefore), "MMM d, yyyy")
                            : "Not set"}
                        </p>
                        <p>
                          Allocated Engineers:{" "}
                          {project.allocations?.length > 0
                            ? engineers
                                .filter((eng) =>
                                  project.allocations.some(
                                    (alloc) => alloc.engineerId === eng.id,
                                  ),
                                )
                                .map((eng) => eng.name)
                                .join(", ")
                            : "None"}
                          Assigned Engineers:{" "}
                          {project.assignedEngineers?.length > 0
                            ? engineers
                                .filter((eng) =>
                                  project.assignedEngineers.includes(
                                    String(eng.id),
                                  ),
                                )
                                .map((eng) => eng.name)
                                .join(", ")
                            : "None"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => startEdit(project)}
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
            ))}
        </ul>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">
              {editingProject ? "Edit Project" : "Add Project"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Estimated Hours
                </label>
                <input
                  type="number"
                  value={formData.estimatedHours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estimatedHours: parseInt(e.target.value),
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Start After
                </label>
                <input
                  type="date"
                  value={formData.startAfter}
                  onChange={(e) =>
                    setFormData({ ...formData, startAfter: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  End Before
                </label>
                <input
                  type="date"
                  value={formData.endBefore}
                  onChange={(e) =>
                    setFormData({ ...formData, endBefore: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Allocate Engineers
                </label>
                <select
                  multiple
                  value={formData.allocations.map((a) => a.engineerId)}
                  onChange={(e) => {
                    const selectedEngineers = Array.from(
                      e.target.selectedOptions,
                      (option) => option.value,
                    );

                    const startDate = formData.startAfter
                      ? new Date(formData.startAfter)
                      : new Date();
                    const endDate = formData.endBefore
                      ? new Date(formData.endBefore)
                      : new Date(
                          startDate.getTime() +
                            formData.estimatedHours * 60 * 60 * 1000,
                        );

                    const newAllocations = selectedEngineers.map(
                      (engineerId) => ({
                        engineerId,
                        startDate,
                        endDate,
                        percentage: 100,
                      }),
                    );

                    setFormData({
                      ...formData,
                      allocations: newAllocations,
                    });
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {engineers.map((engineer) => (
                    <option key={engineer.id} value={engineer.id}>
                      {engineer.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Assigned Engineers
                </label>
                <select
                  multiple
                  value={formData.assignedEngineers}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      assignedEngineers: Array.from(
                        e.target.selectedOptions,
                        (option) => String(option.value),
                      ),
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {engineers.map((engineer) => (
                    <option key={engineer.id} value={engineer.id}>
                      {engineer.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  {editingProject ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Projects;
