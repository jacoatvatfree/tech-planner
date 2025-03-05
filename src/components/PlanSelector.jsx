import React, { useState } from "react";
import { usePlanStore } from "../store/planStore";
import { useProjectStore } from "../store/projectStore";
import { useTeamStore } from "../store/teamStore";
import logger from "../utils/logger";
import { makePlan } from "../lib/factories";
import {
  deprecatedGetTeamData,
  deprecatedAllocationsToTeamMemberIds,
} from "../utils/deprecatedCompatibility";
import {
  PlusIcon,
  TrashIcon,
  ArrowUpTrayIcon,
  PencilIcon,
  DocumentArrowDownIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";

function PlanForm({ onSubmit, onCancel, initialData = null }) {
  const { team, currentPlanId: teamPlanId } = useTeamStore();
  const { projects, currentPlanId: projectPlanId } = useProjectStore();
  const [formData, setFormData] = useState(
    initialData
      ? {
          name: initialData.name,
          startDate: format(new Date(initialData.startDate), "yyyy-MM-dd"),
          endDate: format(new Date(initialData.endDate), "yyyy-MM-dd"),
          excludes: initialData.excludes?.join(", ") || "",
        }
      : {
          name: "",
          startDate: format(new Date(), "yyyy-MM-dd"),
          endDate: format(new Date(), "yyyy-MM-dd"),
          excludes: "",
        },
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const planData = {
      name: formData.name,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      excludes: formData.excludes
        ? formData.excludes
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s.length > 0)
        : [],
    };

    if (initialData) {
      onSubmit({ ...planData, id: initialData.id });
    } else {
      onSubmit(makePlan(planData));
    }
    resetForm();
  };

  const handleExportPlan = () => {
    // Get the current plan ID
    const planId = initialData?.id;
    
    // Ensure we're exporting data for the correct plan
    // Filter team and projects to only include those for this plan
    const planTeam = team.filter(member => !member.planId || member.planId === planId);
    const planProjects = projects.filter(project => !project.planId || project.planId === planId);
    
    // Create the plan data with the current team and projects
    const planData = {
      plan: {
        name: formData.name,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        excludes: formData.excludes
          ? formData.excludes
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s.length > 0)
          : [],
        id: planId || uuidv4(),
      },
      team: planTeam, // Include only team members for this plan
      projects: planProjects, // Include only projects for this plan
    };

    const blob = new Blob([JSON.stringify(planData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plan-${formData.name || "new-plan"}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
    });
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-500 bg-opacity-75 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-medium mb-4">
          {initialData ? "Edit Plan" : "Add New Plan"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="form-input"
              placeholder="Enter plan name"
              required
            />
          </div>
          <div>
            <label className="form-label">Start Date</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              className="form-input"
              required
            />
          </div>
          <div>
            <label className="form-label">End Date</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
              className="form-input"
              required
            />
          </div>
          <div>
            <label className="form-label">Excludes</label>
            <input
              type="text"
              value={formData.excludes}
              onChange={(e) =>
                setFormData({ ...formData, excludes: e.target.value })
              }
              className="form-input"
              placeholder="e.g., 'weekends, 2024/12/25'"
            />
          </div>

          <div className="flex justify-between pt-4">
            <div>
              {initialData && (
                <button
                type="button"
                onClick={handleExportPlan}
                className="px-4 py-2 text-sm font-medium text-gray-800 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 inline-flex items-center"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                Export
              </button>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {initialData ? "Save" : "Add"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PlanSelector() {
  const {
    plans,
    addPlan,
    updatePlan,
    setCurrentPlanId,
    currentPlanId,
    removePlan,
    undoChange,
    redoChange,
    undoStack,
    redoStack,
  } = usePlanStore();
  const [planToEdit, setPlanToEdit] = useState(null);
  const { initializeProjects, addProject } = useProjectStore();
  const { initializeTeam, addTeamMember } = useTeamStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePlanSubmit = (plan) => {
    if (planToEdit) {
      updatePlan(plan.id, plan);
    } else {
      addPlan(plan);
    }
    setPlanToEdit(null);
    setIsModalOpen(false);
  };

  const handleEditPlan = (plan) => {
    setPlanToEdit(plan);
    setIsModalOpen(true);
  };

  const handleDeletePlan = async (planId, planName) => {
    if (window.confirm(`Delete plan "${planName}" and all its data?`)) {
      // Remove the plan - this will also clear the current plan ID and notify other stores
      removePlan(planId);
    }
  };

  const handleImportPlan = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      // Generate new IDs for the imported plan and its components
      const newPlanId = uuidv4();

      // Create new plan
      const newPlan = {
        id: newPlanId,
        name: `${importData.plan.name}`,
        startDate: new Date(importData.plan.startDate),
        endDate: new Date(importData.plan.endDate),
        excludes: importData.plan.excludes || [],
      };

      // Add the new plan
      await addPlan(newPlan);

      // Set the current plan ID immediately - this will initialize other stores
      setCurrentPlanId(newPlanId);

      // Create a mapping of old to new IDs for team members and projects
      const teamMemberIdMap = {};
      const projectIdMap = {};

      // Import team members first and build ID mapping
      const teamMembers = deprecatedGetTeamData(importData);
      const teamMemberPromises = teamMembers.map((teamMember) => {
        const oldId = teamMember.id;
        const newId = uuidv4();
        teamMemberIdMap[oldId] = newId;

        // Create new team member without allocations property
        const { allocations, ...teamMemberWithoutAllocations } = teamMember;
        const newTeamMember = {
          ...teamMemberWithoutAllocations,
          id: newId,
          planId: newPlanId,
          // allocations property is intentionally omitted to adopt the new schema
        };
        return addTeamMember(newTeamMember);
      });

      await Promise.all(teamMemberPromises);

      // Import projects with their allocations in a single step
      const projectPromises = importData.projects.map((project) => {
        const oldId = project.id;
        const newId = uuidv4();
        projectIdMap[oldId] = newId;

        // Map the allocations with new IDs if they exist and reset only 1970-01-01 dates
        const newAllocations = project.allocations
          ? project.allocations.map((allocation) => {
              // Check if dates are 1970-01-01 (epoch) or invalid
              const startDate = new Date(allocation.startDate);
              const endDate = new Date(allocation.endDate);
              const isStartDateEpoch = startDate.getFullYear() === 1970;
              const isEndDateEpoch = endDate.getFullYear() === 1970;

              return {
                engineerId: teamMemberIdMap[allocation.engineerId], // Keep engineerId for backward compatibility
                projectId: newId,
                startDate: isStartDateEpoch ? null : startDate,
                endDate: isEndDateEpoch ? null : endDate,
                percentage: allocation.percentage,
              };
            })
          : [];

        // Check if startAfter is 1970-01-01 (epoch) or invalid
        const startAfter = project.startAfter
          ? new Date(project.startAfter)
          : null;
        const isStartAfterEpoch =
          startAfter && startAfter.getFullYear() === 1970;

        // Convert allocations to teamMemberIds and discard allocations
        const teamMemberIds = project.teamMemberIds
          ? project.teamMemberIds
              .map((id) => teamMemberIdMap[id])
              .filter(Boolean)
          : newAllocations.length
            ? deprecatedAllocationsToTeamMemberIds(newAllocations)
            : [];
            
        const newProject = {
          ...project,
          id: newId,
          startAfter: isStartAfterEpoch ? null : startAfter, // Only reset if it's 1970-01-01
          endBefore: project.endBefore ? new Date(project.endBefore) : null, // Keep endBefore as it's a constraint
          planId: newPlanId,
          teamMemberIds, // Use the converted teamMemberIds
          // allocations property is intentionally omitted to adopt the new schema
        };

        return addProject(newProject);
      });

      await Promise.all(projectPromises);
      // Reset the file input
      event.target.value = "";
    } catch (error) {
      logger.error("Error importing plan:", error);
      alert("Error importing plan. Please check the file format.");
    }
  };

  return (
    <div className="py-4">
      <div className="sm:hidden">
        <div className="flex space-x-2 mb-2">
          <select
            className="form-select flex-grow"
            value={currentPlanId || ""}
            onChange={(e) => setCurrentPlanId(e.target.value)}
          >
            <option value="">Select a plan</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} {currentPlanId === plan.id ? "(current)" : ""}
              </option>
            ))}
          </select>
          <div className="flex space-x-2">
            {currentPlanId && (
              <>
                <button
                  onClick={undoChange}
                  disabled={undoStack.length === 0}
                  className={`p-2 rounded-md ${
                    undoStack.length > 0
                      ? "text-gray-400 hover:text-blue-600 hover:bg-gray-100"
                      : "text-gray-300 cursor-not-allowed"
                  }`}
                  title="Undo"
                >
                  <ArrowUturnLeftIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={redoChange}
                  disabled={redoStack.length === 0}
                  className={`p-2 rounded-md ${
                    redoStack.length > 0
                      ? "text-gray-400 hover:text-blue-600 hover:bg-gray-100"
                      : "text-gray-300 cursor-not-allowed"
                  }`}
                  title="Redo"
                >
                  <ArrowUturnRightIcon className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const plan = plans.find((p) => p.id === currentPlanId);
                    handleDeletePlan(plan.id, plan.name);
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-gray-100"
                  title="Delete current plan"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </>
            )}
            <div className="flex space-x-2">
              <label className="inline-flex items-center p-2 rounded-md text-white bg-green-100 hover:bg-green-200 cursor-pointer">
                <ArrowUpTrayIcon className="h-5 w-5" />
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportPlan}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center p-2 rounded-md text-white bg-blue-600 hover:bg-blue-700"
                title="Add new plan"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="hidden sm:block">
        <nav className="flex space-x-4" aria-label="Plans">
          {plans.map((plan) => (
            <div key={plan.id} className="flex items-center">
              <button
                onClick={() => setCurrentPlanId(plan.id)}
                className={`
                  px-3 py-2 rounded-md text-sm font-medium
                  ${
                    currentPlanId === plan.id
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-500 hover:text-gray-700"
                  }
                `}
              >
                {plan.name}
              </button>
              <div className="flex ml-2">
                {currentPlanId === plan.id && (
                  <>
                    <button
                      onClick={undoChange}
                      disabled={undoStack.length === 0}
                      className={`p-1 rounded-full mr-1 ${
                        undoStack.length > 0
                          ? "text-gray-400 hover:text-blue-600 hover:bg-gray-100"
                          : "text-gray-300 cursor-not-allowed"
                      }`}
                      title="Undo"
                    >
                      <ArrowUturnLeftIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={redoChange}
                      disabled={redoStack.length === 0}
                      className={`p-1 rounded-full mr-1 ${
                        redoStack.length > 0
                          ? "text-gray-400 hover:text-blue-600 hover:bg-gray-100"
                          : "text-gray-300 cursor-not-allowed"
                      }`}
                      title="Redo"
                    >
                      <ArrowUturnRightIcon className="h-4 w-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleEditPlan(plan)}
                  className="p-1 text-gray-400 hover:text-blue-600 rounded-full hover:bg-gray-100 mr-1"
                  title="Edit plan"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeletePlan(plan.id, plan.name)}
                  className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
                  title="Delete plan"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          <div className="flex space-x-2">
            <label className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 bg-green-100 hover:bg-green-200 cursor-pointer">
              <ArrowUpTrayIcon className="h-4 w-4 mr-1" />
              Import
              <input
                type="file"
                accept=".json"
                onChange={handleImportPlan}
                className="hidden"
              />
            </label>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              New
            </button>
          </div>
        </nav>
      </div>
      {isModalOpen && (
        <PlanForm
          onSubmit={handlePlanSubmit}
          onCancel={() => {
            setPlanToEdit(null);
            setIsModalOpen(false);
          }}
          initialData={planToEdit}
        />
      )}
    </div>
  );
}
