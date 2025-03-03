import React, { useState, useMemo } from "react";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { usePlanStore } from "../../store/planStore";
import { useProjectStore } from "../../store/projectStore";
import { useTeamStore } from "../../store/teamStore";
import { CopyButton } from "../common/CopyButton";

// Export as named export for lazy loading compatibility
export function DebugSection() {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Use more specific selectors to prevent unnecessary re-renders
  const { currentPlanId, currentPlan } = usePlanStore(state => ({
    currentPlanId: state.currentPlanId,
    currentPlan: state.currentPlan()
  }));
  
  const { projects } = useProjectStore(state => ({
    projects: state.projects
  }));
  
  const { team } = useTeamStore(state => ({
    team: state.team
  }));

  // Memoize filtered data
  const planProjects = useMemo(() => 
    projects.filter(p => p.planId === currentPlanId),
    [projects, currentPlanId]
  );
  
  const planTeam = useMemo(() => 
    team.filter(t => t.planId === currentPlanId),
    [team, currentPlanId]
  );

  // Memoize debug data
  const debugData = useMemo(() => {
    // Only generate debug data if expanded to save resources
    if (!isExpanded) return "";
    
    return JSON.stringify(
      {
        plan: currentPlan,
        projects: planProjects,
        team: planTeam,
      },
      null,
      2
    );
  }, [isExpanded, currentPlan, planProjects, planTeam]);

  return (
    <div className="border rounded-lg border-gray-200 print:hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center justify-between text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <span>Debug Information</span>
        <ChevronRightIcon
          className={`h-5 w-5 transform transition-transform ${
            isExpanded ? "rotate-90" : ""
          }`}
        />
      </button>

      {isExpanded && (
        <div className="mt-2 mx-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500">
              {planProjects.length} projects, {planTeam.length} team members
            </span>
            <CopyButton text={debugData} />
          </div>
          <pre className="whitespace-pre-wrap text-sm font-mono bg-white p-4 rounded border border-gray-200 overflow-x-auto max-h-[400px]">
            {debugData}
          </pre>
        </div>
      )}
    </div>
  );
}

// Default export for compatibility with both import styles
export default { DebugSection };
