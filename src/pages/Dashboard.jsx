import React, { useEffect, useState } from "react";
import { usePlanStore } from "../store/planStore";
import { useProjectStore } from "../store/projectStore";
import { useEngineerStore } from "../store/engineerStore";
import { calculatePlanCapacity } from "../lib/scheduler/calculatePlanCapacity";
import { calculateSchedule } from "../lib/scheduler/calculateSchedule";
import { v4 as uuidv4 } from "uuid";

export default function Dashboard() {
  const { currentPlanId, plans, currentPlan: getCurrentPlan } = usePlanStore();
  const { projects, initializeProjects } = useProjectStore();
  const { engineers, initializeEngineers } = useEngineerStore();
  const [utilization, setUtilization] = useState({
    totalCapacityHours: 0,
    assignedHours: 0,
    utilizationPercentage: 0,
  });
  const [scheduleData, setScheduleData] = useState();

  const planProjects = React.useMemo(
    () => projects.filter((p) => p.planId === currentPlanId),
    [projects, currentPlanId],
  );

  const planEngineers = React.useMemo(
    () => engineers.filter((e) => e.planId === currentPlanId),
    [engineers, currentPlanId],
  );

  // Initialize data when plan changes
  useEffect(() => {
    if (currentPlanId) {
      initializeProjects(currentPlanId);
      initializeEngineers(currentPlanId);
    }
  }, [currentPlanId, initializeProjects, initializeEngineers]);

  // Calculate schedule when projects or engineers change
  const currentScheduleData = React.useMemo(
    () => calculateSchedule(planProjects, planEngineers),
    [planProjects, planEngineers],
  );

  // Update schedule state and calculate utilization
  useEffect(() => {
    setScheduleData(currentScheduleData);

    const plan = getCurrentPlan();
    if (!currentPlanId || !planEngineers.length || !plan) {
      // Reset utilization when there's no valid data
      setUtilization({
        totalCapacityHours: 0,
        assignedHours: 0,
        utilizationPercentage: 0,
      });
      return;
    }

    if (currentScheduleData) {
      const capacityData = calculatePlanCapacity(
        planEngineers,
        currentScheduleData,
        plan,
        planProjects,
      );
      setUtilization(capacityData);
    }
  }, [
    currentPlanId,
    currentScheduleData,
    planEngineers,
    planProjects,
    getCurrentPlan,
  ]);

  const handleExportPlan = () => {
    const currentPlan = getCurrentPlan();
    if (!currentPlan) return;

    const exportData = {
      plan: currentPlan,
      engineers: planEngineers,
      projects: planProjects,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plan-${currentPlan.name}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="flex gap-4">
          <button
            onClick={handleExportPlan}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Export Plan
          </button>
        </div>
      </div>
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
                  {utilization.utilizationPercentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${
                    utilization.utilizationPercentage > 100
                      ? "bg-red-600"
                      : utilization.utilizationPercentage > 85
                        ? "bg-yellow-400"
                        : "bg-green-600"
                  }`}
                  style={{
                    width: `${Math.min(utilization.utilizationPercentage, 100)}%`,
                  }}
                ></div>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Total Capacity: {Math.round(utilization.totalCapacityHours)} hours
            </p>
            <p className="text-sm text-gray-600">
              Assigned Hours: {Math.round(utilization.assignedHours)} hours
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
