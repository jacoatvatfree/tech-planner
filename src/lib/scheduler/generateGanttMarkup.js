import { dateUtils } from "./dateUtils";

function calculateAssignmentDetails(
  assignment,
  engineers,
  projects,
  assignments,
  safeEndDate,
) {
  const startDate = dateUtils.getNextWeekday(new Date(assignment.startDate));
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

  // Calculate duration in working days
  const project = projects.find((p) => p.id === assignment.projectId);
  const hoursPerDay = totalWeeklyHours / 5;
  const days = Math.max(1, Math.ceil(project.estimatedHours / hoursPerDay));

  // Calculate if project ends after endBefore date by adding business days
  let projectEndDate = new Date(startDate);
  for (let i = 0; i < days; i++) {
    projectEndDate = dateUtils.getNextWeekday(
      new Date(projectEndDate.setDate(projectEndDate.getDate() + 1)),
    );
  }
  const isCritical =
    (project.endBefore && projectEndDate > new Date(project.endBefore)) ||
    projectEndDate > safeEndDate;

  const shortId = assignment.projectId.substring(0, 8);
  const percentageLabel =
    assignment.percentage < 100
      ? ` (${Math.round(assignment.percentage)}%)`
      : "";

  const completionLabel =
    project.percentComplete === 100
      ? "done,"
      : project.percentComplete > 0
        ? "active,"
        : "";

  const criticalLabel = isCritical ? "crit," : "";

  return {
    startDate,
    days,
    shortId,
    percentageLabel,
    completionLabel,
    criticalLabel,
    project,
  };
}

function generateAssignmentMarkup(assignment, details, itemName) {
  const escapedName = itemName.replace(/[:#]/g, " ");
  const projectCompletion = Math.round(details.project.percentComplete || 0);

  return `        ${escapedName}${details.percentageLabel} :${details.completionLabel}${details.criticalLabel}${details.shortId}, ${dateUtils.toISOLocalString(details.startDate)}, ${details.days}d\n`;
}

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
          const details = calculateAssignmentDetails(
            assignment,
            engineers,
            projects,
            assignments,
            safeEndDate,
          );
          markup += generateAssignmentMarkup(
            assignment,
            details,
            `${project.name} (${Math.round(project.percentComplete || 0)}%)`,
          );
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
          const details = calculateAssignmentDetails(
            assignment,
            engineers,
            projects,
            assignments,
            safeEndDate,
          );
          markup += generateAssignmentMarkup(
            assignment,
            details,
            engineer.name,
          );
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
