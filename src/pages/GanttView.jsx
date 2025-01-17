import React, { useMemo, useEffect, useState } from "react";
import GanttChart from "../components/GanttChart";
import BitnoiseScheduler from "../components/BitnoiseScheduler";
import useProjectStore from "../store/projectStore";
import useEngineerStore from "../store/engineerStore";

function GanttView() {
  const { projects } = useProjectStore();
  const { engineers } = useEngineerStore();
  const [key, setKey] = useState(0);
  const [viewType, setViewType] = useState("mermaid"); // 'bitnoise' or 'mermaid'

  useEffect(() => {
    // Force remount of GanttChart when component mounts
    setKey((prev) => prev + 1);
  }, []);

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
            (engId) =>
              engineers.find((eng) => eng.id.toString() === engId.toString())
                ?.name || `Unknown (${engId})`,
          ),
        };
      }),
    [projects, engineers],
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Resource Schedule</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => setViewType("bitnoise")}
            className={`px-4 py-2 rounded-md ${
              viewType === "bitnoise"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Modern View
          </button>
          <button
            onClick={() => setViewType("mermaid")}
            className={`px-4 py-2 rounded-md ${
              viewType === "mermaid"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Mermaid View
          </button>
        </div>
      </div>

      {viewType === "mermaid" ? (
        <GanttChart key={`mermaid-${key}`} tasks={tasks} />
      ) : (
        <BitnoiseScheduler key={`bitnoise-${key}`} tasks={tasks} />
      )}
    </div>
  );
}

export default GanttView;
