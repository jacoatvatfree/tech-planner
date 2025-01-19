import React, { useMemo, useEffect } from "react";
    import GanttChart from "../components/gantt/GanttChart";
    import { useProjectStore } from "../store/projectStore";
    import { useEngineerStore } from "../store/engineerStore";
    import { calculateSchedule, generateGanttMarkup } from "../lib";
    import { usePlanStore } from "../store/planStore";

    export default function GanttView() {
      const { projects, initializeProjects } = useProjectStore();
      const { engineers, initializeEngineers } = useEngineerStore();
      const { currentPlanId } = usePlanStore();

      useEffect(() => {
        if (currentPlanId) {
          initializeProjects(currentPlanId);
          initializeEngineers(currentPlanId);
        }
      }, [currentPlanId, initializeProjects, initializeEngineers]);

      const assignments = useMemo(() => {
        return calculateSchedule(projects, engineers);
      }, [projects, engineers]);

      const markup = useMemo(() => {
        return generateGanttMarkup(assignments, engineers, projects);
      }, [assignments, engineers, projects]);

      return (
        <div>
          <h2 className="text-2xl font-bold mb-4">Schedule</h2>
          <GanttChart markup={markup} />
        </div>
      );
    }
