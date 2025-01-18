import React from 'react';
import { useEngineerStore } from '../../store/engineerStore';

export default function EngineerSelect({ selectedEngineers, onEngineerSelect }) {
  const { engineers } = useEngineerStore();

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        Allocate Engineers
      </label>
      <select
        multiple
        value={selectedEngineers}
        onChange={(e) => {
          const selectedEngineers = Array.from(
            e.target.selectedOptions,
            (option) => option.value
          );
          onEngineerSelect(selectedEngineers);
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
  );
}
