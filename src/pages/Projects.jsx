import React, { useState } from "react";
import useProjectStore from "../store/projectStore";
import useEngineerStore from "../store/engineerStore";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
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
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
    assignedEngineers: [],
    allocation: 100,
  });

  const calculateDuration = (estimatedHours, allocation, assignedEngineers) => {
    // Assuming 8 working hours per day
    const hoursPerDay = 8;
    // Total resource hours per day = number of engineers * (allocation/100) * 8
    const dailyResourceHours =
      assignedEngineers.length * (allocation / 100) * hoursPerDay;
    // Duration in days = estimated hours / daily resource hours
    const durationDays = Math.ceil(estimatedHours / (dailyResourceHours || 1));
    return durationDays;
  };

  const findEarliestAvailableStart = (engineers, duration, allocation) => {
    const projects = useProjectStore.getState().projects;
    let latestEndDate = new Date();

    engineers.forEach((engineerId) => {
      // Get all projects for this engineer
      const engineerProjects = projects.filter((p) =>
        p.assignedEngineers.includes(engineerId),
      );

      // Sort projects by start date
      engineerProjects.sort(
        (a, b) => new Date(a.startDate) - new Date(b.startDate),
      );

      let currentDate = new Date();
      let currentAllocation = 0;

      // Create timeline of allocations
      const timeline = [];
      engineerProjects.forEach((project) => {
        const startDate = new Date(project.startDate);
        const endDate = new Date(project.startDate);
        endDate.setDate(endDate.getDate() + (project.duration || 0));

        timeline.push({
          date: startDate,
          type: "start",
          allocation: project.allocation,
        });
        timeline.push({
          date: endDate,
          type: "end",
          allocation: project.allocation,
        });
      });

      // Sort timeline events
      timeline.sort((a, b) => a.date - b.date);

      // Find first available slot
      for (let i = 0; i < timeline.length; i++) {
        const event = timeline[i];

        if (event.type === "start") {
          currentAllocation += event.allocation;
        } else {
          currentAllocation -= event.allocation;
        }

        if (currentAllocation + allocation > 100) {
          currentDate = timeline[i].date;
        }

        if (currentDate > latestEndDate) {
          latestEndDate = new Date(currentDate);
        }
      }
    });

    // Add one day to ensure no overlap
    latestEndDate.setDate(latestEndDate.getDate() + 1);
    return format(latestEndDate, "yyyy-MM-dd");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const duration = calculateDuration(
      formData.estimatedHours,
      formData.allocation,
      formData.assignedEngineers,
    );

    const projectData = {
      ...formData,
      duration,
      startDate: editingProject
        ? formData.startDate
        : findEarliestAvailableStart(
            formData.assignedEngineers,
            duration,
            formData.allocation,
          ),
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
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
      assignedEngineers: [],
      allocation: 100,
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
      startDate: format(new Date(project.startDate), "yyyy-MM-dd"),
      endDate: format(new Date(project.endDate), "yyyy-MM-dd"),
      assignedEngineers: project.assignedEngineers || [],
      allocation: project.allocation,
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
        <ul className="divide-y divide-gray-200">
          {projects.map((project) => (
            <li key={project.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {project.name}
                  </h3>
                  <div className="mt-1 text-sm text-gray-500">
                    <p>{project.description}</p>
                    <p>Estimated Hours: {project.estimatedHours}</p>
                    <p>
                      Timeline:{" "}
                      {format(new Date(project.startDate), "MMM d, yyyy")} -{" "}
                      {format(new Date(project.endDate), "MMM d, yyyy")}
                    </p>
                    <p>Allocation: {project.allocation}%</p>
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
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
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
                        (option) => option.value,
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
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Allocation (%)
                </label>
                <input
                  type="number"
                  value={formData.allocation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      allocation: parseInt(e.target.value),
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min="0"
                  max="100"
                  required
                />
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
