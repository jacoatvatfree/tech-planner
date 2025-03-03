import React, { useState, useEffect, useRef } from "react";
import { makeProject } from "../../lib";
import TeamMemberSelect from "../team/TeamMemberSelect";
import { format } from "date-fns";

export default function ProjectForm({
  onSubmit,
  editingProject,
  onCancel,
  planStartDate,
}) {
  const [formData, setFormData] = useState(
    editingProject
      ? {
          ...editingProject,
          startAfter: editingProject.startAfter
            ? format(new Date(editingProject.startAfter), "yyyy-MM-dd")
            : "",
          endBefore: editingProject.endBefore
            ? format(new Date(editingProject.endBefore), "yyyy-MM-dd")
            : "",
        }
      : {
          name: "",
          description: "",
          estimatedHours: 0,
          startAfter: format(
            planStartDate
              ? new Date(
                  Math.max(
                    new Date().getTime(),
                    new Date(planStartDate).getTime(),
                  ),
                )
              : new Date(),
            "yyyy-MM-dd",
          ),
          endBefore: "",
          priority: 999,
          allocations: [],
          percentComplete: 0,
        },
  );

  const nameInputRef = useRef(null);

  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form data before submit:", formData);
    const projectData = {
      ...(editingProject ? { id: editingProject.id } : {}),
      ...makeProject({
        name: formData.name,
        estimatedHours: Number(formData.estimatedHours),
        startAfter: formData.startAfter ? new Date(formData.startAfter) : null,
        endBefore: formData.endBefore ? new Date(formData.endBefore) : null,
        priority: Number(formData.priority),
        percentComplete: Number(formData.percentComplete),
      }),
      description: formData.description,
      allocations: formData.allocations.map((allocation) => ({
        ...allocation,
        startDate: new Date(allocation.startDate),
        endDate: new Date(allocation.endDate),
      })),
      planId: editingProject?.planId,
    };

    console.log("Project data being submitted:", projectData);
    onSubmit(projectData);
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
      allocations: [],
    });
    onCancel();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg p-6 max-w-2xl w-full space-y-4"
    >
      <h3 className="text-lg font-medium mb-4">
        {editingProject ? "Edit Project" : "Add Project"}
      </h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <input
          ref={nameInputRef}
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="form-input mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="Enter project name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="form-input mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          rows={3}
          placeholder="Enter project description"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Estimated Hours
        </label>
        <div className="flex items-center gap-2 w-full">
          <input
            type="number"
            value={formData.estimatedHours}
            onChange={(e) =>
              setFormData({
                ...formData,
                estimatedHours: parseInt(e.target.value),
              })
            }
            className="form-input mt-1 block w-1/4 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            min="0"
            required
          />
          <div className="flex flex-wrap gap-2 mt-1 w-3/4">
            {[
              { label: "1d", hours: 8 },
              { label: "2d", hours: 16 },
              { label: "3d", hours: 24 },
              { label: "1w", hours: 40 },
              { label: "2w", hours: 80 },
              { label: "3w", hours: 120 },
              { label: "4w", hours: 160 },
              { label: "6w", hours: 240 },
            ].map(({ label, hours }) => (
              <button
                key={label}
                type="button"
                onClick={() =>
                  setFormData({ ...formData, estimatedHours: hours })
                }
                className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Start After
        </label>
        <input
          type="date"
          value={formData.startAfter}
          onChange={(e) =>
            setFormData({ ...formData, startAfter: e.target.value })
          }
          className="form-input mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          End Before
        </label>
        <input
          type="date"
          value={formData.endBefore}
          onChange={(e) =>
            setFormData({ ...formData, endBefore: e.target.value })
          }
          className="form-input mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Priority
        </label>
        <input
          type="number"
          value={formData.priority}
          onChange={(e) =>
            setFormData({
              ...formData,
              priority: parseInt(e.target.value),
            })
          }
          className="form-input mt-1 block w-1/4 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          min="1"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Completion ({formData.percentComplete}%)
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={formData.percentComplete || 0}
          onChange={(e) =>
            setFormData({
              ...formData,
              percentComplete: parseInt(e.target.value),
            })
          }
          className="form-range w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <TeamMemberSelect
        selectedTeamMembers={formData.allocations.map((a) => a.engineerId)}
        onTeamMemberSelect={(selectedTeamMembers) => {
          const startDate = formData.startAfter
            ? new Date(formData.startAfter)
            : new Date();
          const endDate = formData.endBefore
            ? new Date(formData.endBefore)
            : new Date(
                startDate.getTime() + formData.estimatedHours * 60 * 60 * 1000,
              );

          // Preserve existing allocations that are still selected
          const existingAllocations = formData.allocations.filter(
            (allocation) => selectedTeamMembers.includes(allocation.engineerId),
          );

          // Add new allocations for newly selected team members
          const newTeamMemberIds = selectedTeamMembers.filter(
            (engineerId) =>
              !formData.allocations.some(
                (allocation) => allocation.engineerId === engineerId,
              ),
          );

          const newAllocations = [
            ...existingAllocations,
            ...newTeamMemberIds.map((engineerId) => ({
              engineerId, // Keep engineerId for backward compatibility
              startDate,
              endDate,
              percentage: 100,
            })),
          ];

          setFormData({
            ...formData,
            allocations: newAllocations,
          });
        }}
      />

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {editingProject ? "Update" : "Add"}
        </button>
      </div>
    </form>
  );
}
