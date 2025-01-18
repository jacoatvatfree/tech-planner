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
          <h3 className="text-lg font-medium mb-2">Schedule Summary</h3>
          <div className="text-sm text-gray-600">
            <p>Total Projects: {projects.length}</p>
            <p>Scheduled Tasks: {assignments.length}</p>
            <p>Total Engineers: {engineers.length}</p>
          </div>
        </div>
        <GanttChart markup={markup} />
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-2xl font-bold">Debug Information</h2>

        <details className="border rounded-lg p-4">
          <summary className="font-medium cursor-pointer">Store Data</summary>
          <pre className="mt-4 p-4 bg-gray-50 rounded overflow-auto max-h-96 text-sm">
            {JSON.stringify({ projects, engineers }, null, 2)}
          </pre>
        </details>

        <details className="border rounded-lg p-4">
          <summary className="font-medium cursor-pointer">
            Generated Markup
          </summary>
          <pre className="mt-4 p-4 bg-gray-50 rounded overflow-auto max-h-96 text-sm">
            {markup}
          </pre>
        </details>
      </div>
    </div>
  );
}
