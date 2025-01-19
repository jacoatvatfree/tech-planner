import React, { useEffect } from "react";
import { usePlanStore } from "../store/planStore";
import { useProjectStore } from "../store/projectStore";
import { useEngineerStore } from "../store/engineerStore";
import { calculateQuarterlyCapacity } from "../lib/scheduler/calculateQuarterlyCapacity";
import { calculateSchedule } from "../lib/scheduler/calculateSchedule";

export default function Dashboard() {
  const { currentPlanId } = usePlanStore();
  const { projects, initializeProjects } = useProjectStore();
  const { engineers, initializeEngineers } = useEngineerStore();

  useEffect(() => {
    if (currentPlanId) {
      initializeProjects(currentPlanId);
      initializeEngineers(currentPlanId);
    }
  }, [currentPlanId, initializeProjects, initializeEngineers]);

  const planProjects = projects.filter((p) => p.planId === currentPlanId);
  const planEngineers = engineers.filter((e) => e.planId === currentPlanId);
  const scheduleData = calculateSchedule(planProjects, planEngineers);
  const { totalCapacityHours, assignedHours, utilizationPercentage } =
    calculateQuarterlyCapacity(engineers, scheduleData);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">Plan Resource Usage</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Capacity Utilization
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {utilizationPercentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${
                    utilizationPercentage > 100
                      ? "bg-red-600"
                      : utilizationPercentage > 85
                        ? "bg-yellow-400"
                        : "bg-green-600"
                  }`}
                  style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                ></div>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Total Capacity: {Math.round(totalCapacityHours)} hours
            </p>
            <p className="text-sm text-gray-600">
              Assigned Hours: {Math.round(assignedHours)} hours
            </p>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-lg font-medium mb-2">Project Overview</h3>
          <p>Total Projects: {projects.length}</p>
          <p>Total Team Members: {engineers.length}</p>
        </div>
      </div>
    </div>
  );
}
