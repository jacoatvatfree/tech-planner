import React, { useState, useEffect } from "react";
import { useProjectStore } from "../store/projectStore";
import { useEngineerStore } from "../store/engineerStore";
import { usePlanStore } from "../store/planStore";
import { generateGanttMarkup } from "../lib/scheduler/generateGanttMarkup";
import { calculateSchedule } from "../lib/scheduler/calculateSchedule";
import GanttChart from "../components/gantt/GanttChart";
import { Statistics } from "../components/gantt/Statistics";

export default function GanttView() {
  const { currentPlan: getCurrentPlan, currentPlanId } = usePlanStore();
  const currentPlan = getCurrentPlan();
  const { projects, setSchedule, initializeProjects } = useProjectStore();
  const { engineers, initializeEngineers, updateEngineer } = useEngineerStore();
  const [scheduleData, setScheduleData] = useState(null);
  const [markup, setMarkup] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewType, setViewType] = useState("resource");

  useEffect(() => {
    if (currentPlanId) {
      console.log("Initializing data for plan:", currentPlanId);
      initializeProjects(currentPlanId);
      initializeEngineers(currentPlanId);
    }
  }, [currentPlanId, initializeProjects, initializeEngineers]);

  // Separate effect for updating engineer planIds
  useEffect(() => {
    if (currentPlanId && engineers.length > 0) {
      const engineersToUpdate = engineers.filter(
        (engineer) => !engineer.planId,
      );
      engineersToUpdate.forEach((engineer) => {
        updateEngineer(engineer.id, { ...engineer, planId: currentPlanId });
      });
    }
  }, [currentPlanId, engineers.length]); // Only depend on length changes

  // Wait for currentPlan to be defined
  useEffect(() => {
    if (!currentPlan) {
      setError("No plan selected");
      setIsLoading(false);
    }
  }, [currentPlan]);

  const planProjects = projects.filter((p) => p.planId === currentPlanId);
  const planEngineers = currentPlanId
    ? engineers.map((engineer) => ({
        ...engineer,
        planId: currentPlanId,
      }))
    : [];
  console.log("Current Plan:", currentPlan);
  console.log("All Projects:", projects);
  console.log("Filtered Plan Projects:", planProjects);
  console.log("All Engineers:", engineers);
  console.log("Filtered Plan Engineers:", planEngineers);
  console.log("Current Plan ID:", currentPlanId);

  useEffect(() => {
    let isMounted = true;

    const calculateAndSetSchedule = () => {
      try {
        setIsLoading(true);
        setError(null);

        // Skip calculation if no projects or engineers
        if (!planProjects?.length || !planEngineers?.length) {
          if (isMounted) {
            setScheduleData(null);

            console.log("end date", currentPlan);
            setMarkup(
              generateGanttMarkup(
                [],
                [],
                [],
                currentPlan?.startDate,
                currentPlan?.endDate,
              ),
            );
          }
          return;
        }

        const result = calculateSchedule(planProjects, planEngineers);

        if (!isMounted) return;

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
          planEngineers,
          planProjects,
          currentPlan?.startDate,
          currentPlan?.endDate,
          viewType,
        );

        if (!newMarkup) {
          throw new Error("Failed to generate Gantt markup");
        }

        if (isMounted) {
          setMarkup(newMarkup);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          console.error("Schedule calculation failed:", err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    calculateAndSetSchedule();

    return () => {
      isMounted = false;
    };
  }, [
    currentPlan?.startDate,
    currentPlan?.endDate,
    planProjects, // Watch filtered projects instead of all projects
    planEngineers, // Watch filtered engineers instead of all engineers
    viewType,
    currentPlanId,
  ]);
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
      <div className="flex items-center space-x-4 p-4">
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
