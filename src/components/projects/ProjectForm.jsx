import React, { useState, useEffect, useRef } from "react";
import { makeProject } from "../../lib";
import EngineerSelect from "../engineers/EngineerSelect";
import { format } from "date-fns";

export default function ProjectForm({ onSubmit, editingProject, onCancel }) {
  const [formData, setFormData] = useState(editingProject ? {
    ...editingProject,
    startAfter: editingProject.startAfter ? format(new Date(editingProject.startAfter), 'yyyy-MM-dd') : '',
    endBefore: editingProject.endBefore ? format(new Date(editingProject.endBefore), 'yyyy-MM-dd') : ''
  } : {
    name: "",
    description: "",
    estimatedHours: 0,
    startAfter: format(new Date(), "yyyy-MM-dd"),
    endBefore: "",
    priority: 3,
    allocations: []
  });

  const nameInputRef = useRef(null);

  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

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
      onSubmit(projectData);
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
      allocations: []
    });
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="form-label">Name</label>
        <input
          ref={nameInputRef}
          type="text"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          className="form-input"
          placeholder="Enter project name"
          required
        />
      </div>

      <div>
        <label className="form-label">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="form-textarea"
          rows={3}
          placeholder="Enter project description"
        />
      </div>

      <div>
        <label className="form-label">Estimated Hours</label>
        <input
          type="number"
          value={formData.estimatedHours}
          onChange={(e) =>
            setFormData({
              ...formData,
              estimatedHours: parseInt(e.target.value),
            })
          }
          className="form-input"
          min="0"
          placeholder="Enter estimated hours"
          required
        />
      </div>

      <div>
        <label className="form-label">Start After</label>
        <input
          type="date"
          value={formData.startAfter}
          onChange={(e) =>
            setFormData({ ...formData, startAfter: e.target.value })
          }
          className="form-input"
        />
      </div>

      <div>
        <label className="form-label">End Before</label>
        <input
          type="date"
          value={formData.endBefore}
          onChange={(e) =>
            setFormData({ ...formData, endBefore: e.target.value })
          }
          className="form-input"
        />
      </div>

      <div>
        <label className="form-label">Priority</label>
        <select
          value={formData.priority}
          onChange={(e) =>
            setFormData({ ...formData, priority: parseInt(e.target.value) })
          }
          className="form-select"
        >
          <option value="1">High</option>
          <option value="2">Medium</option>
          <option value="3">Low</option>
        </select>
      </div>

      <EngineerSelect
        selectedEngineers={formData.allocations.map(a => a.engineerId)}
        onEngineerSelect={(selectedEngineers) => {
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
