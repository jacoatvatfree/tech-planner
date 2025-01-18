import React, { useMemo } from "react";
import GanttChart from "../components/gantt/GanttChart";
import { useProjectStore } from "../store/projectStore";
import { useEngineerStore } from "../store/engineerStore";
import {
  calculateSchedule,
  generateGanttMarkup,
} from "../lib/scheduler/index.js";

export default function GanttView() {
  const { projects } = useProjectStore();
  const { engineers } = useEngineerStore();

  const { assignments, markup } = useMemo(() => {
    const validProjects = projects.filter(
      (project) =>
        project.estimatedHours &&
        project.allocations &&
        project.allocations.length > 0,
    );

    if (validProjects.length === 0 || engineers.length === 0) {
      return {
        assignments: [],
        markup: generateGanttMarkup([], []),
      };
    }

    const assignments = calculateSchedule(validProjects, engineers);
    const markup = generateGanttMarkup(assignments, engineers);
    return { assignments, markup };
  }, [projects, engineers]);

  if (!assignments.length) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Gantt Chart</h2>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-700">
            No valid projects found. Please ensure projects have estimated hours
            and allocated engineers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Resource Schedule</h2>
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Summary</h3>
          <div className="text-sm text-gray-600 space-y-2 grid grid-cols-4">
            <div>
              <p>Total Projects: {projects.length}</p>
              <p>Total Engineers: {engineers.length}</p>
            </div>
            <div className="">
              <p className="font-medium">Resource Usage:</p>
              {engineers.map((engineer) => {
                const engineerAssignments = assignments.filter(
                  (a) => a.engineerId === engineer.id,
                );
                const totalAllocatedHours = engineerAssignments.reduce(
                  (sum, assignment) => {
                    const project = projects.find(
                      (p) => p.id === assignment.projectId,
                    );
                    if (!project) return sum;

                    const allocatedEngineers = engineers.filter((e) =>
                      project.allocations.some(
                        (alloc) => alloc.engineerId === e.id,
                      ),
                    );

                    const totalWeeklyCapacity = allocatedEngineers.reduce(
                      (cap, eng) => cap + (eng.weeklyHours || 40),
                      0,
                    );

                    const engineerWeeklyHours = engineer.weeklyHours || 40;
                    const engineerProportion =
                      engineerWeeklyHours / totalWeeklyCapacity;

                    const engineerShare =
                      project.estimatedHours * engineerProportion;

                    return sum + engineerShare;
                  },
                  0,
                );

                // Calculate total possible hours for the quarter (13 weeks)
                const weeklyHours = engineer.weeklyHours || 40;
                const quarterlyCapacity = weeklyHours * 13;

                // Calculate utilization percentage
                const utilizationPercentage =
                  (totalAllocatedHours / quarterlyCapacity) * 100;

                // Determine color based on utilization
                const textColor =
                  utilizationPercentage > 90
                    ? "text-red-600"
                    : utilizationPercentage > 70
                      ? "text-green-600"
                      : "text-yellow-600";

                return (
                  <p key={engineer.id} className="text-gray-500">
                    {engineer.name}:{" "}
                    <span className={textColor}>
                      {Math.round(utilizationPercentage)}%
                    </span>{" "}
                    ({Math.round(totalAllocatedHours)} / {quarterlyCapacity}{" "}
                    hours)
                  </p>
                );
              })}
            </div>
          </div>
        </div>
        <GanttChart markup={markup} />
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="relative">
          <button
            onClick={() => navigator.clipboard.writeText(markup)}
            className="absolute top-2 right-2 px-2 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Copy
          </button>
          <pre className="mt-4 p-4 bg-gray-50 rounded overflow-auto max-h-96 text-sm">
            {markup}
          </pre>
        </div>
        <h3 className="text-xl font-bold">Debug Information</h3>

        <details className="border rounded-lg p-4">
          <summary className="font-medium cursor-pointer">Store Data</summary>
          <pre className="mt-4 p-4 bg-gray-50 rounded overflow-auto max-h-96 text-sm">
            {JSON.stringify({ projects, engineers }, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}
