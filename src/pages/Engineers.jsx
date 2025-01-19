import React, { useState, useEffect } from "react";
import { useEngineerStore } from "../store/engineerStore";
import { makeEngineer } from "../lib";
import { usePlanStore } from "../store/planStore";

export default function Engineers() {
  const {
    engineers,
    addEngineer,
    updateEngineer,
    removeEngineer,
    initializeEngineers,
  } = useEngineerStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEngineer, setEditingEngineer] = useState(null);
  const { currentPlanId } = usePlanStore();

  useEffect(() => {
    if (currentPlanId) {
      initializeEngineers(currentPlanId);
    }
  }, [currentPlanId, initializeEngineers]);

  const handleAddEngineer = (engineer) => {
    addEngineer(engineer);
    setIsModalOpen(false);
  };

  const handleEditEngineer = (engineer) => {
    setEditingEngineer(engineer);
    setIsModalOpen(true);
  };

  const handleUpdateEngineer = (engineer) => {
    updateEngineer(engineer.id, engineer);
    setIsModalOpen(false);
    setEditingEngineer(null);
  };

  const handleRemoveEngineer = (id) => {
    removeEngineer(id);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Team</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add Team Member
        </button>
      </div>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {engineers.map((engineer) => (
            <li
              key={engineer.id}
              className="px-6 py-3 hover:bg-gray-50 flex items-center justify-between"
            >
              <div className="flex-1">
                <h3 className="text-base font-medium text-gray-900">
                  {engineer.name}
                </h3>
                <p className="text-sm text-gray-600">
                  Weekly Hours: {engineer.weeklyHours}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditEngineer(engineer)}
                  className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleRemoveEngineer(engineer.id)}
                  className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {isModalOpen && (
        <EngineerForm
          onSubmit={editingEngineer ? handleUpdateEngineer : handleAddEngineer}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingEngineer(null);
          }}
          editingEngineer={editingEngineer}
        />
      )}
    </div>
  );
}

function EngineerForm({ onSubmit, onCancel, editingEngineer }) {
  const [formData, setFormData] = useState(
    editingEngineer
      ? { ...editingEngineer }
      : { name: "", weeklyHours: 40 },
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(makeEngineer(formData));
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-medium mb-4">
          {editingEngineer ? "Edit Team Member" : "Add Team Member"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="form-input"
              placeholder="Enter team member name"
              required
            />
          </div>
          <div>
            <label className="form-label">Weekly Hours</label>
            <input
              type="number"
              value={formData.weeklyHours}
              onChange={(e) =>
                setFormData({ ...formData, weeklyHours: Number(e.target.value) })
              }
              className="form-input"
              placeholder="Enter weekly hours"
              required
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
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
              {editingEngineer ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
