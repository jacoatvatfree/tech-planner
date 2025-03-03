import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useProjectStore } from "../store/projectStore";
import { useTeamStore } from "../store/teamStore";
import { usePlanStore } from "../store/planStore";
import logger from "../utils/logger";
import { generateGanttMarkup } from "../lib/scheduler/generateGanttMarkup";
import { calculateSchedule } from "../lib/scheduler/calculateSchedule";
import GanttChart from "../components/gantt/GanttChart";
import { Statistics } from "../components/gantt/Statistics";

export default function GanttView() {
  // Get data from stores with more specific selectors
  const { currentPlan, currentPlanId } = usePlanStore(state => ({
    currentPlan: state.currentPlan(),
    currentPlanId: state.currentPlanId
  }));
  
  const { projects, setSchedule } = useProjectStore(state => ({
    projects: state.projects,
    setSchedule: state.setSchedule
  }));
  
  const { team, updateTeamMember } = useTeamStore(state => ({
    team: state.team,
    updateTeamMember: state.updateTeamMember
  }));
  
  const [scheduleData, setScheduleData] = useState(null);
  const [markup, setMarkup] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewType, setViewType] = useState("resource");

  // Memoize filtered data
  const planProjects = useMemo(
    () => projects.filter((p) => p.planId === currentPlanId),
    [projects, currentPlanId]
  );

  const planTeam = useMemo(
    () => team.filter((t) => t.planId === currentPlanId),
    [team, currentPlanId]
  );

  // Separate effect for updating team member planIds
  useEffect(() => {
    if (currentPlanId && team.length > 0) {
      const teamMembersToUpdate = team.filter(
        (teamMember) => !teamMember.planId
      );
      teamMembersToUpdate.forEach((teamMember) => {
        updateTeamMember(teamMember.id, { ...teamMember, planId: currentPlanId });
      });
    }
  }, [currentPlanId, team, updateTeamMember]);

  // Wait for currentPlan to be defined
  useEffect(() => {
    if (!currentPlan) {
      setError("No plan selected");
      setIsLoading(false);
      document.title = "Resource Planner";
    } else {
      document.title = `${currentPlan.name} - Resource Planner`;
    }
  }, [currentPlan]);

  // Memoize schedule calculation and markup generation
  const calculateAndSetSchedule = useCallback(() => {
    try {
      setIsLoading(true);
      setError(null);

      // Skip calculation if no projects or team members
      if (!planProjects?.length || !planTeam?.length || !currentPlan) {
        setScheduleData(null);
        setMarkup(generateGanttMarkup([], [], [], currentPlan || {}));
        setIsLoading(false);
        return;
      }

      const result = calculateSchedule(
        planProjects,
        planTeam,
        currentPlan?.excludes || [],
        currentPlan?.startDate || null
      );

      // Only update if we have actual changes
      const resultString = JSON.stringify(result);
      setScheduleData((prevData) => {
        const prevString = JSON.stringify(prevData);
        return prevString === resultString ? prevData : result;
      });

      // Only update store if assignments have changed
      const currentAssignments = JSON.stringify(result?.assignments || []);
      const prevAssignments = JSON.stringify(scheduleData?.assignments || []);
      if (currentAssignments !== prevAssignments) {
        setSchedule(result);
      }

      const newMarkup = generateGanttMarkup(
        result?.assignments || [],
        planTeam,
        planProjects,
        currentPlan,
        viewType
      );

      if (!newMarkup) {
        throw new Error("Failed to generate Gantt markup");
      }

      setMarkup(newMarkup);
    } catch (err) {
      setError(err.message);
      logger.error("Schedule calculation failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPlan,
    planProjects,
    planTeam,
    viewType,
    scheduleData,
    setSchedule
  ]);

  // Update schedule when dependencies change
  useEffect(() => {
    calculateAndSetSchedule();
  }, [calculateAndSetSchedule]);
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded">Error: {error}</div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">Calculating schedule...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4 p-4 print:hidden">
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            id="resource-view"
            name="view-type"
            value="resource"
            checked={viewType === "resource"}
            onChange={(e) => setViewType(e.target.value)}
            className="text-blue-600 focus:ring-blue-500"
          />
          <label
            htmlFor="resource-view"
            className="text-sm font-medium text-gray-700"
          >
            By Team Member
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            id="project-view"
            name="view-type"
            value="project"
            checked={viewType === "project"}
            onChange={(e) => setViewType(e.target.value)}
            className="text-blue-600 focus:ring-blue-500"
          />
          <label
            htmlFor="project-view"
            className="text-sm font-medium text-gray-700"
          >
            By Project
          </label>
        </div>
      </div>
      {markup && <GanttChart markup={markup} />}
    </div>
  );
}
