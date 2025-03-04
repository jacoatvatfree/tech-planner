import React, { useEffect, useState, useCallback } from "react";
import { usePlanStore } from "../store/planStore";
import { useProjectStore } from "../store/projectStore";
import { useTeamStore } from "../store/teamStore";
import { calculatePlanCapacity } from "../lib/scheduler/calculatePlanCapacity";
import { calculateSchedule } from "../lib/scheduler/calculateSchedule";
import { v4 as uuidv4 } from "uuid";

export default function Dashboard() {
  // Get data from stores with more specific selectors
  const { currentPlan, currentPlanId } = usePlanStore(state => ({
    currentPlan: state.currentPlan(),
    currentPlanId: state.currentPlanId
  }));
  
  const { projects } = useProjectStore(state => ({
    projects: state.projects
  }));
  
  const { team } = useTeamStore(state => ({
    team: state.team
  }));
  
  const [utilization, setUtilization] = useState({
    totalCapacityHours: 0,
    assignedHours: 0,
    utilizationPercentage: 0,
  });
  const [scheduleData, setScheduleData] = useState();

  // Memoize filtered data
  const planProjects = React.useMemo(
    () => projects.filter((p) => p.planId === currentPlanId),
    [projects, currentPlanId],
  );

  const planTeam = React.useMemo(
    () => team.filter((t) => t.planId === currentPlanId),
    [team, currentPlanId],
  );

  // Memoize schedule calculation
  const calculateScheduleData = useCallback(() => {
    if (!planProjects.length || !planTeam.length || !currentPlan) {
      return null;
    }
    return calculateSchedule(planProjects, planTeam, currentPlan?.excludes || []);
  }, [planProjects, planTeam, currentPlan]);

  // Calculate utilization
  const calculateUtilization = useCallback(() => {
    if (!currentPlanId || !planTeam.length || !currentPlan || !scheduleData) {
      return {
        totalCapacityHours: 0,
        assignedHours: 0,
        utilizationPercentage: 0,
      };
    }
    
    return calculatePlanCapacity(
      planTeam,
      scheduleData,
      currentPlan,
      planProjects,
    );
  }, [currentPlanId, planTeam, currentPlan, scheduleData, planProjects]);

  // Update schedule data when dependencies change
  useEffect(() => {
    const newScheduleData = calculateScheduleData();
    setScheduleData(newScheduleData);
  }, [calculateScheduleData]);

  // Update utilization when schedule data changes
  useEffect(() => {
    const newUtilization = calculateUtilization();
    setUtilization(newUtilization);
  }, [calculateUtilization]);

  const handleExportPlan = () => {
    if (!currentPlan) return;

    const exportData = {
      plan: currentPlan,
      team: planTeam,
      projects: planProjects,
      excludes: currentPlan.excludes,
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
          {/* Export button moved to plan form */}
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
          <p>Total Team Members: {team.length}</p>
        </div>
      </div>
    </div>
  );
}
