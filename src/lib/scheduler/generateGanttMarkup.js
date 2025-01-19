export function generateGanttMarkup(
  assignments,
  engineers,
  projects,
  planStartDate,
  planEndDate,
  viewType = "resource", // 'resource' or 'project'
) {
  console.log("Generating Gantt Markup with:", {
    assignmentsCount: assignments?.length,
    engineersCount: engineers?.length,
    projectsCount: projects?.length,
    engineers: engineers,
    planStartDate,
    planEndDate,
  });

  // Create safe dates first
  const safeStartDate = planStartDate ? new Date(planStartDate) : new Date();
  const safeEndDate = planEndDate ? new Date(planEndDate) : new Date();

  // Basic validation
  if (!assignments?.length || !engineers?.length || !projects?.length) {
    return `gantt
      dateFormat YYYY-MM-DD
      title Resource Schedule
      section No Data
      No assignments found :2024-01-01, 1d`;
  }

  // Check for invalid dates
  if (isNaN(safeStartDate.getTime()) || isNaN(safeEndDate.getTime())) {
    console.error("Invalid dates received:", { planStartDate, planEndDate });
    return `gantt
    dateFormat YYYY-MM-DD
    title Resource Schedule
    section Error
    Invalid dates :2024-01-01, 1d`;
  }

  // Initialize markup
  let markup = `gantt
    dateFormat YYYY-MM-DD
    title Resource Schedule
    axisFormat %Y-%m-%d
    tickInterval 1week
    excludes weekends
    
        section Start
        s :milestone, ${safeStartDate.toISOString().split("T")[0]}, 0d
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
        markup += `    No assignments :${new Date().toISOString().split("T")[0]}, 1d\n`;
        return;
      }

      engineerAssignments.forEach((assignment) => {
        const project = projects.find((p) => p.id === assignment.projectId);
        if (!project) return;

        try {
          // Format dates
          const startDate = new Date(assignment.startDate);
          if (isNaN(startDate.getTime())) throw new Error("Invalid date");

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

          // Calculate duration in days
          const hoursPerDay = totalWeeklyHours / 5;
          const days = Math.max(
            1,
            Math.ceil(project.estimatedHours / hoursPerDay),
          );

          const escapedProjectName = project.name.replace(/[:#]/g, " ");
          const percentageLabel =
            assignment.percentage < 100
              ? ` (${Math.round(assignment.percentage)}%)`
              : "";
          const shortId = assignment.projectId.substring(0, 8);

          markup += `    ${escapedProjectName}${percentageLabel} :${shortId}, ${startDate.toISOString().split("T")[0]}, ${days}d\n`;
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
      markup += `\n    section ${project.name}\n`;

      // Get all assignments for this project and sort by start date
      const projectAssignments = assignments
        .filter((a) => a.projectId === project.id)
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

      if (projectAssignments.length === 0) {
        markup += `    No assignments :${new Date().toISOString().split("T")[0]}, 1d\n`;
        return;
      }

      projectAssignments.forEach((assignment) => {
        const engineer = engineers.find((e) => e.id === assignment.engineerId);
        if (!engineer) return;

        try {
          const startDate = new Date(assignment.startDate);
          if (isNaN(startDate.getTime())) throw new Error("Invalid date");

          // Calculate total weekly hours for the project
          const totalWeeklyHours = projectAssignments.reduce((sum, a) => {
            const eng = engineers.find((e) => e.id === a.engineerId);
            if (!eng) return sum;
            const percentage = a.percentage || 100;
            return sum + (eng.weeklyHours || 40) * (percentage / 100);
          }, 0);

          // Calculate duration in days
          const hoursPerDay = totalWeeklyHours / 5;
          const days = Math.max(
            1,
            Math.ceil(project.estimatedHours / hoursPerDay),
          );

          const escapedEngineerName = engineer.name.replace(/[:#]/g, " ");
          const percentageLabel =
            assignment.percentage < 100
              ? ` (${Math.round(assignment.percentage)}%)`
              : "";
          const shortId = assignment.projectId.substring(0, 8);

          markup += `    ${escapedEngineerName}${percentageLabel} :${shortId}, ${startDate.toISOString().split("T")[0]}, ${days}d\n`;
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
  markup += `    e :milestone, ${planEndDate.split("T")[0]}, 0d\n\n`;

  return markup;
}
