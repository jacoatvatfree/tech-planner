import React, { useMemo } from "react";
import GanttChart from "../components/GanttChart";
import { useProjectStore } from "../store/projectStore";
import { useEngineerStore } from "../store/engineerStore";
import {
  makeSchedule,
  scheduleProjects,
  calculateScheduleMetrics,
} from "../lib";
import { generateMermaidGantt } from "../lib/scheduler";

function GanttView() {
  const { projects } = useProjectStore();
  const { engineers } = useEngineerStore();

  const mermaidMarkup = useMemo(() => {
    return generateMermaidGantt(projects, engineers);
  }, [projects, engineers]);

  // Create schedule and calculate metrics
  const { optimizedSchedule, metrics } = useMemo(() => {
    const schedule = makeSchedule({
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days ahead
      projects,
      engineers,
    });

    const optimizedSchedule = scheduleProjects(schedule);
    const metrics = calculateScheduleMetrics(optimizedSchedule);

    return { optimizedSchedule, metrics };
  }, [projects, engineers]);

  // Transform schedule data for visualization
  const tasks = useMemo(
    () =>
      optimizedSchedule.projects.flatMap((project) =>
        project.allocations.map((allocation) => ({
          id: `${project.id}-${allocation.engineerId}`,
          text: project.name,
          start_date: allocation.startDate,
          duration: Math.ceil(
            (allocation.endDate - allocation.startDate) / (24 * 60 * 60 * 1000),
          ),
          progress: 0,
          allocation: allocation.percentage,
          assignedEngineers: [
            engineers.find((e) => e.id === allocation.engineerId)?.name ||
              "Unknown",
          ],
        })),
      ),
    [optimizedSchedule, engineers],
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Resource Schedule</h2>

        {/* Metrics Display */}
        <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Engineer Utilization</h3>
            {Object.entries(metrics.engineerUtilization).map(
              ([engId, utilization]) => (
                <div key={engId} className="flex justify-between text-sm">
                  <span>{engineers.find((e) => e.id === engId)?.name}</span>
                  <span>{Math.round(utilization)}%</span>
                </div>
              ),
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Schedule Conflicts</h3>
            {metrics.conflicts.length === 0 ? (
              <p className="text-sm text-gray-600">No conflicts detected</p>
            ) : (
              <ul className="text-sm text-red-600">
                {metrics.conflicts.map((conflict, idx) => (
                  <li key={idx}>
                    {conflict.type === "deadline_missed" &&
                      `${projects.find((p) => p.id === conflict.projectId)?.name} misses deadline by ${Math.ceil(
                        (conflict.actual - conflict.expected) /
                          (24 * 60 * 60 * 1000),
                      )} days`}
                  </li>
                ))}
              </ul>
            )}
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
