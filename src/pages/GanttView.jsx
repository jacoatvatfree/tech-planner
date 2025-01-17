import React, { useMemo } from "react";
import GanttChart from "../components/GanttChart";
import useProjectStore from "../store/projectStore";
import useEngineerStore from "../store/engineerStore";

function GanttView() {
  const { projects } = useProjectStore();
  const { engineers } = useEngineerStore();

  const tasks = useMemo(
    () =>
      projects.map((project) => {
        const startDate = new Date(project.startDate);
        const duration =
          project.duration || Math.ceil(project.estimatedHours / 8);

        return {
          id: project.id,
          text: project.name,
          start_date: startDate,
          duration: duration,
          allocation: project.allocation,
          progress: project.progress || 0,
          assignedEngineers: project.assignedEngineers.map(
            (engId) => engineers.find((eng) => eng.id === engId)?.name || engId,
          ),
        };
      }),
    [projects, engineers],
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Resource Schedule</h2>
      <GanttChart tasks={tasks} />
    </div>
  );
}

export default GanttView;
