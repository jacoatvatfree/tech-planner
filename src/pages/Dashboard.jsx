import React, { useEffect, useState, useCallback, useMemo } from "react";
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
  const [timelineProgress, setTimelineProgress] = useState({
    percentage: 0,
    overrunPercentage: 0,
    latestEndDate: null,
  });

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

  // Calculate timeline progress
  const calculateTimelineProgress = useCallback(() => {
    if (!currentPlan || !scheduleData?.scheduledProjects?.length) {
      return {
        percentage: 0,
        overrunPercentage: 0,
        latestEndDate: null,
      };
    }

    const planStart = new Date(currentPlan.startDate);
    const planEnd = new Date(currentPlan.endDate);
    const planDuration = planEnd.getTime() - planStart.getTime();
    
    if (planDuration <= 0) {
      return {
        percentage: 0,
        overrunPercentage: 0,
        latestEndDate: null,
      };
    }

    // Find the latest end date among all scheduled projects
    const projectEndDates = scheduleData.scheduledProjects
      .filter(p => p.endDate)
      .map(p => new Date(p.endDate));
    
    if (!projectEndDates.length) {
      return {
        percentage: 0,
        overrunPercentage: 0,
        latestEndDate: null,
      };
    }
    
    const latestEndDate = new Date(Math.max(...projectEndDates.map(d => d.getTime())));
    
    // Calculate percentage of plan timeline used
    let percentage = ((latestEndDate.getTime() - planStart.getTime()) / planDuration) * 100;
    let overrunPercentage = 0;
    
    // If the latest end date exceeds the plan end date, calculate overrun
    if (latestEndDate > planEnd) {
      overrunPercentage = ((latestEndDate.getTime() - planEnd.getTime()) / planDuration) * 100;
      percentage = 100; // Cap the normal percentage at 100%
    }
    
    return {
      percentage: Math.round(percentage),
      overrunPercentage: Math.round(overrunPercentage),
      latestEndDate,
    };
  }, [currentPlan, scheduleData]);

  // Update timeline progress when schedule data changes
  useEffect(() => {
    const newTimelineProgress = calculateTimelineProgress();
    setTimelineProgress(newTimelineProgress);
  }, [calculateTimelineProgress]);

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
      <div className="grid grid-cols-2 gap-4 mb-4">
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
          <h3 className="text-lg font-medium mb-4">Project Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg">
              <span className="text-4xl font-bold text-blue-600">{planProjects.length}</span>
              <span className="text-sm text-gray-600 mt-2">Total Projects</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-green-50 rounded-lg">
              <span className="text-4xl font-bold text-green-600">{planTeam.length}</span>
              <span className="text-sm text-gray-600 mt-2">Team Members</span>
            </div>
          </div>
        </div>
      </div>
      
      {currentPlan && (
        <div className="bg-white shadow rounded-lg p-4 mb-4">
          <h3 className="text-lg font-medium mb-4">Plan Timeline Usage</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Schedule
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {timelineProgress.percentage + timelineProgress.overrunPercentage}%
                  {timelineProgress.overrunPercentage > 0 && ` (${timelineProgress.overrunPercentage}% overrun)`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                {timelineProgress.overrunPercentage > 0 ? (
                  // When there's an overrun, scale both parts to fit in the container
                  <div className="w-full h-full flex">
                    {/* Normal progress (scaled) */}
                    <div 
                      className="h-2.5 bg-blue-600 flex-shrink-0"
                      style={{
                        width: `${(timelineProgress.percentage / (timelineProgress.percentage + timelineProgress.overrunPercentage)) * 100}%`,
                        borderRight: '2px solid white'
                      }}
                    ></div>
                    {/* Overrun portion (scaled) */}
                    <div 
                      className="h-2.5 bg-orange-500 flex-shrink-0"
                      style={{
                        width: `${(timelineProgress.overrunPercentage / (timelineProgress.percentage + timelineProgress.overrunPercentage)) * 100}%`
                      }}
                    ></div>
                  </div>
                ) : (
                  // When there's no overrun, just show normal progress
                  <div
                    className="h-2.5 bg-blue-600"
                    style={{
                      width: `${timelineProgress.percentage}%`
                    }}
                  ></div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div>
                <p>Plan Start: {new Date(currentPlan.startDate).toLocaleDateString()}</p>
                <p>Plan End: {new Date(currentPlan.endDate).toLocaleDateString()}</p>
              </div>
              <div>
                {timelineProgress.latestEndDate && (
                  <p className={timelineProgress.overrunPercentage > 0 ? "text-orange-500 font-medium text-right" : ""}>
                    Latest Project End: {timelineProgress.latestEndDate.toLocaleDateString()}
                    {timelineProgress.overrunPercentage > 0 && " (overrun)"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
