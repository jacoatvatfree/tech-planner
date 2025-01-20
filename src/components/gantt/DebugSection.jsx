import React, { useState } from "react";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { usePlanStore } from "../../store/planStore";
import { useProjectStore } from "../../store/projectStore";
import { useEngineerStore } from "../../store/engineerStore";
import { CopyButton } from "../common/CopyButton";

export function DebugSection() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { currentPlanId, plans } = usePlanStore();
  const { projects } = useProjectStore();
  const { engineers } = useEngineerStore();

  const debugData = React.useMemo(() => {
    const currentPlan = plans.find((p) => p.id === currentPlanId);
    const planProjects = projects.filter((p) => p.planId === currentPlanId);
    const planEngineers = engineers.filter((e) => e.planId === currentPlanId);

    return JSON.stringify(
      {
        plan: currentPlan,
        projects: planProjects,
        engineers: planEngineers,
      },
      null,
      2,
    );
  }, [currentPlanId, plans, projects, engineers]);

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
          <div className="flex justify-end mb-2">
            <CopyButton text={debugData} />
          </div>
          <pre className="whitespace-pre-wrap text-sm font-mono bg-white p-4 rounded border border-gray-200 overflow-x-auto">
            {debugData}
          </pre>
        </div>
      )}
    </div>
  );
}
