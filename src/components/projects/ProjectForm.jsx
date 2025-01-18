import React, { useState } from 'react';
import { format } from 'date-fns';
import { makeProject } from '../../lib';
import EngineerSelect from '../engineers/EngineerSelect';
import { useEngineerStore } from '../../store/engineerStore';

const initialFormState = {
  name: '',
  description: '',
  estimatedHours: 0,
  startAfter: format(new Date(), 'yyyy-MM-dd'),
  endBefore: '',
  priority: 3,
  allocations: []
};

export default function ProjectForm({ onSubmit, editingProject, onCancel }) {
  const [formData, setFormData] = useState(editingProject ? {
    ...editingProject,
    startAfter: editingProject.startAfter ? format(new Date(editingProject.startAfter), 'yyyy-MM-dd') : '',
    endBefore: editingProject.endBefore ? format(new Date(editingProject.endBefore), 'yyyy-MM-dd') : ''
  } : initialFormState);

  const { engineers } = useEngineerStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    const projectData = makeProject({
      ...formData,
      estimatedHours: Number(formData.estimatedHours),
      startAfter: formData.startAfter ? new Date(formData.startAfter) : null,
      endBefore: formData.endBefore ? new Date(formData.endBefore) : null,
      priority: Number(formData.priority)
    });
    onSubmit(projectData);
    setFormData(initialFormState);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Estimated Hours</label>
        <input
          type="number"
          name="estimatedHours"
          value={formData.estimatedHours}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Start After</label>
        <input
          type="date"
          name="startAfter"
          value={formData.startAfter}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">End Before</label>
        <input
          type="date"
          name="endBefore"
          value={formData.endBefore}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <EngineerSelect
        selectedEngineers={formData.allocations.map(a => a.engineerId)}
        onEngineerSelect={(selectedEngineers) => {
          const startDate = formData.startAfter ? new Date(formData.startAfter) : new Date();
          const endDate = formData.endBefore ? new Date(formData.endBefore) : new Date(startDate.getTime() + formData.estimatedHours * 60 * 60 * 1000);
          
          const newAllocations = selectedEngineers.map(engineerId => ({
            engineerId,
            startDate,
            endDate,
            percentage: 100
          }));

          setFormData(prev => ({ ...prev, allocations: newAllocations }));
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
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          {editingProject ? 'Update' : 'Add'}
        </button>
      </div>
    </form>
  );
}
