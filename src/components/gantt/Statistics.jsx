import React from "react";
import { usePlanStore } from "../../store/planStore";
import { useProjectStore } from "../../store/projectStore";
import { useTeamStore } from "../../store/teamStore";

export function Statistics() {
  const { currentPlanId } = usePlanStore();
  const { projects } = useProjectStore();
  const { team } = useTeamStore();

  const planProjects = projects.filter((p) => p.planId === currentPlanId);
  const planTeam = team.filter((t) => t.planId === currentPlanId);

  const { resourceUtilization } = useProjectStore((state) => ({
    resourceUtilization: state.schedule?.resourceUtilization || {
      allocated: 0,
      available: 0,
      percentage: 0,
    },
  }));

  const totalAllocated = resourceUtilization.allocated;
  const totalAvailable = resourceUtilization.available;
  const usagePercentage = resourceUtilization.percentage;

  const stats = [
    { name: "Total Projects", value: planProjects.length },
    { name: "Total Team Members", value: planTeam.length },
    {
      name: "Resource Usage",
      value: `${totalAllocated}/${totalAvailable}`,
      percentage: usagePercentage,
      type: "progress",
    },
  ];

  const getProgressColor = (percentage) => {
    if (percentage <= 75) return "bg-green-500";
    if (percentage <= 90) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="grid grid-cols-3 gap-4 bg-white p-4 rounded-lg border border-gray-200">
      {stats.map((stat) => (
        <div key={stat.name} className="text-center">
          <dt className="text-sm font-medium text-gray-600">{stat.name}</dt>
          <dd className="mt-1">
            {stat.type === "progress" ? (
              <div className="space-y-1">
                <div className="text-lg font-semibold text-gray-900">
                  {stat.value}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${getProgressColor(stat.percentage)}`}
                    style={{ width: `${Math.min(100, stat.percentage)}%` }}
                  />
                </div>
                <div className="text-sm text-gray-500">
                  {stat.percentage.toFixed(1)}% utilized
                </div>
              </div>
            ) : (
              <div className="text-xl font-semibold text-gray-900">
                {stat.value}
              </div>
            )}
          </dd>
        </div>
      ))}
    </div>
  );
}
