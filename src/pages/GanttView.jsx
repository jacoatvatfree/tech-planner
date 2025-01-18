import React, { useMemo } from "react";
import GanttChart from "../components/GanttChart";
import { useProjectStore } from "../store/projectStore";
import { useEngineerStore } from "../store/engineerStore";
import { calculateSchedule, generateMermaidGantt } from "../lib";

function GanttView() {
  const { projects } = useProjectStore();
  const { engineers } = useEngineerStore();

  const { assignments, mermaidMarkup } = useMemo(() => {
    const assignments = calculateSchedule(projects, engineers);
    const mermaidMarkup = generateMermaidGantt(assignments, engineers);
    return { assignments, mermaidMarkup };
  }, [projects, engineers]);

  // Transform assignments for visualization
  const tasks = useMemo(
    () =>
      assignments.map((assignment) => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + assignment.startWeek * 7);

        return {
          id: `${assignment.projectName}-${assignment.engineerId}`,
          text: assignment.projectName,
          start_date: startDate,
          duration: assignment.weeksNeeded * 7, // convert weeks to days
          progress: 0,
          assignedEngineers: [
            engineers.find((e) => e.id === assignment.engineerId)?.name ||
              "Unknown",
          ],
        };
      }),
    [assignments, engineers],
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Resource Schedule</h2>

        {/* Schedule Summary */}
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Schedule Summary</h3>
          <div className="text-sm text-gray-600">
            <p>Total Projects: {projects.length}</p>
            <p>Scheduled Tasks: {assignments.length}</p>
            <p>Total Engineers: {engineers.length}</p>
          </div>
        </div>

        {/* Gantt Chart Views */}
        <div className="space-y-8">
          <GanttChart tasks={tasks} markup={mermaidMarkup} />
        </div>
      </div>
    </div>
  );
}

export default GanttView;
