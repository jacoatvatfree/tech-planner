import React from 'react';
import { useEngineerStore } from '../../store/engineerStore';

export default function EngineerSelect({ selectedEngineers, onEngineerSelect }) {
  const { engineers } = useEngineerStore();

  return (
    <div>
      <label className="form-label">
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
        className="form-select min-h-[120px]"
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
