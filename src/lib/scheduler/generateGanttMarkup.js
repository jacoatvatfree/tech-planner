import { dateUtils } from "./dateUtils";

export function generateGanttMarkup(
  assignments,
  engineers,
  projects,
  plan,
  viewType = "resource", // 'resource' or 'project'
) {
  console.log("Generating Gantt Markup with:", {
    assignmentsCount: assignments?.length,
    engineersCount: engineers?.length,
    projectsCount: projects?.length,
    engineers: engineers,
    planStartDate: plan.startDate,
    planEndDate: plan.endDate,
  });

  // Create safe dates first
  const safeStartDate = plan.startDate ? new Date(plan.startDate) : new Date();
  const safeEndDate = plan.endDate ? new Date(plan.endDate) : new Date();

  // Basic validation
  if (!assignments?.length || !engineers?.length || !projects?.length) {
    return `gantt
      dateFormat YYYY-MM-DD
      title ${plan.name} - Resource Planner
      section No Data
      No assignments found :2024-01-01, 1d`;
  }

  // Check for invalid dates
  if (isNaN(safeStartDate.getTime()) || isNaN(safeEndDate.getTime())) {
    console.error("Invalid dates received:", {
      planStartDate: plan.startDate,
      planEndDate: plan.endDate,
    });
    return `gantt
    dateFormat YYYY-MM-DD
    title ${plan.name} - Resource Planner
    section Error
    Invalid dates :2024-01-01, 1d`;
  }

  // Initialize markup
  let markup = `gantt
    dateFormat YYYY-MM-DD
    title ${plan.name} - Resource Planner
    axisFormat %Y-%m-%d
    tickInterval 1week
    excludes weekends
    
    section Start
        s :milestone, ${dateUtils.toISOLocalString(safeStartDate)}, 0d
    `;

  if (viewType === "resource") {
    // Generate sections for each engineer
    engineers.forEach((engineer) => {
      markup += `\n    section ${engineer.name}\n`;

      // Get all assignments for this engineer and sort by start date
      const engineerAssignments = assignments
        .filter((a) => a.engineerId === engineer.id)
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

      if (engineerAssignments.length === 0) {
        markup += `    No assignments :${dateUtils.toISOLocalString(new Date())}, 1d\n`;
        return;
      }

      engineerAssignments.forEach((assignment) => {
        const project = projects.find((p) => p.id === assignment.projectId);
        if (!project) return;

        try {
          // Format dates
          let startDate = new Date(assignment.startDate);
          if (isNaN(startDate.getTime())) throw new Error("Invalid date");

          // Ensure start date is not on a weekend
          startDate = dateUtils.getNextWeekday(startDate);

          // Calculate total weekly hours for the project
          const projectAssignments = assignments.filter(
            (a) => a.projectId === assignment.projectId,
          );
          const totalWeeklyHours = projectAssignments.reduce((sum, a) => {
            const eng = engineers.find((e) => e.id === a.engineerId);
            if (!eng) return sum;
            const percentage = a.percentage || 100;
            return sum + (eng.weeklyHours || 40) * (percentage / 100);
          }, 0);

          // Calculate duration in working days
          const hoursPerDay = totalWeeklyHours / 5;
          const requiredWorkDays = Math.max(
            1,
            Math.ceil(project.estimatedHours / hoursPerDay),
          );

          // Just use the required work days - Mermaid will handle weekend scheduling
          const days = requiredWorkDays;

          const escapedProjectName = project.name.replace(/[:#]/g, " ");
          const percentageLabel =
            assignment.percentage < 100
              ? ` (${Math.round(assignment.percentage)}%)`
              : "";
          const shortId = assignment.projectId.substring(0, 8);

          const completionLabel =
            project.percentComplete === 100
              ? `done,`
              : project.percentComplete > 0
                ? "active,"
                : "";
          markup += `        ${escapedProjectName} (${Math.round(project.percentComplete || 0)}%) :${completionLabel}${shortId}, ${dateUtils.toISOLocalString(startDate)}, ${days}d\n`;
        } catch (error) {
          console.warn(
            `Skipping invalid assignment for ${engineer.name}:`,
            error,
          );
        }
      });
    });
  } else if (viewType === "project") {
    // Generate sections for each project
    projects.forEach((project) => {
      markup += `\n    section ${project.name} (${Math.round(project.percentComplete || 0)}%)\n`;

      // Get all assignments for this project and sort by start date
      const projectAssignments = assignments
        .filter((a) => a.projectId === project.id)
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

      if (projectAssignments.length === 0) {
        markup += `    No assignments :${dateUtils.toISOLocalString(new Date())}, 1d\n`;
        return;
      }

      projectAssignments.forEach((assignment) => {
        const engineer = engineers.find((e) => e.id === assignment.engineerId);
        if (!engineer) return;

        try {
          let startDate = new Date(assignment.startDate);
          if (isNaN(startDate.getTime())) throw new Error("Invalid date");

          // Ensure start date is not on a weekend
          startDate = dateUtils.getNextWeekday(startDate);

          // Calculate total weekly hours for the project
          const totalWeeklyHours = projectAssignments.reduce((sum, a) => {
            const eng = engineers.find((e) => e.id === a.engineerId);
            if (!eng) return sum;
            const percentage = a.percentage || 100;
            return sum + (eng.weeklyHours || 40) * (percentage / 100);
          }, 0);

          // Calculate duration in working days
          const hoursPerDay = totalWeeklyHours / 5;
          const requiredWorkDays = Math.max(
            1,
            Math.ceil(project.estimatedHours / hoursPerDay),
          );

          // Just use the required work days - Mermaid will handle weekend scheduling
          const days = requiredWorkDays;

          const escapedEngineerName = engineer.name.replace(/[:#]/g, " ");
          const percentageLabel =
            assignment.percentage < 100
              ? ` (${Math.round(assignment.percentage)}%)`
              : "";
          const shortId = assignment.projectId.substring(0, 8);

          const completionLabel =
            project.percentComplete === 100
              ? `done,`
              : project.percentComplete > 0
                ? "active,"
                : "";

          markup += `        ${escapedEngineerName}${percentageLabel} :${completionLabel}${shortId}, ${dateUtils.toISOLocalString(startDate)}, ${days}d\n`;
        } catch (error) {
          console.warn(
            `Skipping invalid assignment for ${project.name}:`,
            error,
          );
        }
      });
    });
  }
  markup += "\n    section End\n";
  markup += `        e :milestone, ${dateUtils.toISOLocalString(safeEndDate)}, 0d\n\n`;

  return markup;
}
