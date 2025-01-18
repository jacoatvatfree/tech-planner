import React from "react";
import { useEngineerStore } from "../store/engineerStore";
import { useProjectStore } from "../store/projectStore";
import { calculateSchedule } from "../lib/scheduler/calculateSchedule";
import { calculateQuarterlyCapacity } from "../lib/scheduler/calculateQuarterlyCapacity";

function Dashboard() {
  const { engineers } = useEngineerStore();
  const { projects } = useProjectStore();

  const totalEngineers = engineers.length;
  const totalProjects = projects.length;
  const assignments = calculateSchedule(projects, engineers);

  // Calculate schedule metrics from assignments
  const now = new Date();
  const activeProjects =
    assignments.length > 0
      ? new Set(
          assignments
            .filter((assignment) => {
              const startDate = new Date(assignment.startDate);
              const endDate = new Date(assignment.startDate);
              endDate.setDate(endDate.getDate() + assignment.weeksNeeded * 7);
              return startDate <= now && endDate >= now;
            })
            .map((a) => a.projectId),
        ).size
      : 0;

  const scheduleStart =
    assignments.length > 0
      ? new Date(Math.min(...assignments.map((a) => new Date(a.startDate))))
      : null;

  const scheduleEnd =
    assignments.length > 0
      ? new Date(
          Math.max(
            ...assignments.map((a) => {
              const endDate = new Date(a.startDate);
              endDate.setDate(endDate.getDate() + a.weeksNeeded * 7);
              return endDate;
            }),
          ),
        )
      : null;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Total Engineers
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {totalEngineers}
            </dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Total Projects
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {totalProjects}
            </dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Schedule Start
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {scheduleStart ? scheduleStart.toLocaleDateString() : "-"}
            </dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Schedule End
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {scheduleEnd ? scheduleEnd.toLocaleDateString() : "-"}
            </dd>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <dt className="text-sm font-medium text-gray-500 truncate">
            Quarterly Utilization
          </dt>
          {(() => {
            const { totalCapacityHours, assignedHours, utilizationPercentage } =
              calculateQuarterlyCapacity(engineers, assignments);

            // Determine color based on utilization
            const barColor =
              utilizationPercentage > 90
                ? "bg-red-500"
                : utilizationPercentage > 70
                  ? "bg-green-500"
                  : "bg-yellow-500";

            return (
              <div>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {utilizationPercentage}%
                </dd>
                <div className="mt-3 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${barColor} transition-all duration-500 ease-in-out`}
                    style={{
                      width: `${Math.min(utilizationPercentage, 100)}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  {Math.round(assignedHours)} / {Math.round(totalCapacityHours)}{" "}
                  hours allocated this quarter
                </p>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
