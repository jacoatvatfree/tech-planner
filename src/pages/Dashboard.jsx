import React, { useEffect } from "react";
import { usePlanStore } from "../store/planStore";
import { useProjectStore } from "../store/projectStore";
import { useEngineerStore } from "../store/engineerStore";
import { calculateQuarterlyCapacity } from "../lib/scheduler/calculateQuarterlyCapacity";
import { calculateSchedule } from "../lib/scheduler/calculateSchedule";
import { v4 as uuidv4 } from "uuid";

export default function Dashboard() {
  const { currentPlanId, plans, addPlan } = usePlanStore();
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

  const handleExportPlan = () => {
    const currentPlan = plans.find((p) => p.id === currentPlanId);
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

  // const handleImportPlan = async (event) => {
  //   const file = event.target.files[0];
  //   if (!file) return;
  //
  //   try {
  //     const text = await file.text();
  //     const importData = JSON.parse(text);
  //
  //     // Generate new IDs for the imported plan and its components
  //     const newPlanId = uuidv4();
  //
  //     // Create new plan
  //     const newPlan = {
  //       ...importData.plan,
  //       id: newPlanId,
  //       name: `${importData.plan.name} (Imported)`,
  //     };
  //
  //     // Add the new plan
  //     await addPlan(newPlan);
  //
  //     // Initialize stores for the new plan
  //     await initializeEngineers(newPlanId);
  //     await initializeProjects(newPlanId);
  //
  //     // Import engineers with new IDs and updated planId
  //     const engineerPromises = importData.engineers.map((engineer) => {
  //       const newEngineer = {
  //         ...engineer,
  //         id: uuidv4(),
  //         planId: newPlanId,
  //       };
  //       return useEngineerStore.getState().addEngineer(newEngineer);
  //     });
  //
  //     // Import projects with new IDs and updated planId
  //     const projectPromises = importData.projects.map((project) => {
  //       const newProject = {
  //         ...project,
  //         id: uuidv4(),
  //         planId: newPlanId,
  //       };
  //       return useProjectStore.getState().addProject(newProject);
  //     });
  //
  //     await Promise.all([...engineerPromises, ...projectPromises]);
  //
  //     // Reset the file input
  //     event.target.value = "";
  //   } catch (error) {
  //     console.error("Error importing plan:", error);
  //     alert("Error importing plan. Please check the file format.");
  //   }
  // };

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
          {/* <label className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded cursor-pointer"> */}
          {/*   Import Plan */}
          {/*   <input */}
          {/*     type="file" */}
          {/*     accept=".json" */}
          {/*     onChange={handleImportPlan} */}
          {/*     className="hidden" */}
          {/*   /> */}
          {/* </label> */}
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
