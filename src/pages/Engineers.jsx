import React, { useState, useEffect, useRef } from "react";
import { useEngineerStore } from "../store/engineerStore";
import { makeEngineer } from "../lib";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

function Engineers() {
  const { engineers, addEngineer, updateEngineer, removeEngineer } = useEngineerStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEngineer, setEditingEngineer] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    weeklyHours: 40,
    skills: "",
  });

  const nameInputRef = useRef(null);

  useEffect(() => {
    if (isModalOpen && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isModalOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const engineerData = makeEngineer({
      name: formData.name,
      weeklyHours: Number(formData.weeklyHours),
      skills: formData.skills,
    });

    if (editingEngineer) {
      updateEngineer(editingEngineer.id, engineerData);
    } else {
      addEngineer(engineerData);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      weeklyHours: 40,
      skills: "",
    });
    setEditingEngineer(null);
    setIsModalOpen(false);
  };

  const startEdit = (engineer) => {
    setEditingEngineer(engineer);
    setFormData({
      name: engineer.name,
      weeklyHours: engineer.weeklyHours,
      skills: engineer.skills,
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Engineers</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Engineer
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {engineers.map((engineer) => (
            <li key={engineer.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {engineer.name}
                  </h3>
                  <div className="mt-1 text-sm text-gray-500">
                    <p>Weekly Hours: {engineer.weeklyHours}</p>
                    <p>Skills: {engineer.skills}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => startEdit(engineer)}
                    className="p-2 text-blue-600 hover:text-blue-800"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => removeEngineer(engineer.id)}
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
              {editingEngineer ? "Edit Engineer" : "Add Engineer"}
            </h3>
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
                  placeholder="Enter engineer name"
                  required
                />
              </div>
              <div>
                <label className="form-label">Weekly Hours</label>
                <input
                  type="number"
                  value={formData.weeklyHours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      weeklyHours: parseInt(e.target.value),
                    })
                  }
                  className="form-input"
                  min="0"
                  max="168"
                  required
                />
              </div>
              <div>
                <label className="form-label">Skills</label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) =>
                    setFormData({ ...formData, skills: e.target.value })
                  }
                  className="form-input"
                  placeholder="Enter skills (comma separated)"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {editingEngineer ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Engineers;
